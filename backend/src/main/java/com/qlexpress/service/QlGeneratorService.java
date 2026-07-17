package com.qlexpress.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class QlGeneratorService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<String, String> FIELD_TYPE_MAP = new HashMap<>();
    static {
        FIELD_TYPE_MAP.put("tradeAmt", "number");
        FIELD_TYPE_MAP.put("mcc", "enum");
        FIELD_TYPE_MAP.put("cardType", "enum");
        FIELD_TYPE_MAP.put("userLevel", "enum");
        FIELD_TYPE_MAP.put("transactionDate", "date");
        FIELD_TYPE_MAP.put("isReturn", "boolean");
        FIELD_TYPE_MAP.put("isInstallment", "boolean");
    }

    private static final Map<String, String> FIELD_NAME_MAP = new HashMap<>();
    static {
        FIELD_NAME_MAP.put("tradeAmt", "交易金额");
        FIELD_NAME_MAP.put("mcc", "商户MCC");
        FIELD_NAME_MAP.put("cardType", "卡片类型");
        FIELD_NAME_MAP.put("userLevel", "用户等级");
        FIELD_NAME_MAP.put("transactionDate", "交易日期");
        FIELD_NAME_MAP.put("isReturn", "是否退货");
        FIELD_NAME_MAP.put("isInstallment", "是否分期");
    }

    public String generate(String canvasJson, List<Map<String, Object>> customFields) {
        try {
            JsonNode graph = objectMapper.readTree(canvasJson);
            JsonNode cells = graph.get("cells");

            Map<String, JsonNode> nodeMap = new HashMap<>();
            List<JsonNode> edges = new ArrayList<>();

            if (cells != null && cells.isArray()) {
                for (JsonNode cell : cells) {
                    String shape = cell.has("shape") ? cell.get("shape").asText() : "";
                    if (!"edge".equals(shape)) {
                        String id = cell.get("id").asText();
                        nodeMap.put(id, cell);
                    } else {
                        edges.add(cell);
                    }
                }
            }

            Map<String, String> fieldTypeMap = new HashMap<>(FIELD_TYPE_MAP);
            Map<String, String> fieldNameMap = new HashMap<>(FIELD_NAME_MAP);
            if (customFields != null) {
                for (Map<String, Object> cf : customFields) {
                    String id = (String) cf.get("id");
                    String type = (String) cf.get("type");
                    String name = (String) cf.get("name");
                    if (id != null && type != null) {
                        fieldTypeMap.put(id, type);
                        fieldNameMap.put(id, name);
                    }
                }
            }

            StringBuilder ql = new StringBuilder();
            ql.append("// 自动生成的 QLExpress 表达式\n");

            // Find start node
            String startId = null;
            for (Map.Entry<String, JsonNode> entry : nodeMap.entrySet()) {
                String shape = entry.getValue().has("shape") ? entry.getValue().get("shape").asText() : "";
                if ("start".equals(shape)) {
                    startId = entry.getKey();
                    break;
                }
            }

            if (startId == null) {
                ql.append("// 未找到起点节点\n");
                return ql.toString();
            }

            ql.append("// === 开始：交易积分核算 ===\n");
            String expr = buildBranch(startId, nodeMap, edges, fieldTypeMap, fieldNameMap, new HashSet<>());
            ql.append(expr);

            return ql.toString().trim();
        } catch (Exception e) {
            return "// 生成 QL 表达式时出错: " + e.getMessage();
        }
    }

    private String buildBranch(String nodeId, Map<String, JsonNode> nodeMap,
                                List<JsonNode> edges, Map<String, String> fieldTypeMap,
                                Map<String, String> fieldNameMap, Set<String> visited) {
        if (visited.contains(nodeId)) return "";
        visited.add(nodeId);

        JsonNode node = nodeMap.get(nodeId);
        if (node == null) return "";

        String shape = node.has("shape") ? node.get("shape").asText() : "";
        JsonNode data = node.get("data");

        List<JsonNode> outEdges = edges.stream()
                .filter(e -> e.has("source") && nodeId.equals(e.get("source").asText()))
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();

        switch (shape) {
            case "start": {
                if (!outEdges.isEmpty()) {
                    String targetId = outEdges.get(0).get("target").asText();
                    sb.append(buildBranch(targetId, nodeMap, edges, fieldTypeMap, fieldNameMap, visited));
                }
                break;
            }
            case "condition": {
                List<Map<String, Object>> conditions = new ArrayList<>();
                if (data != null && data.has("conditions")) {
                    for (JsonNode cond : data.get("conditions")) {
                        Map<String, Object> c = new HashMap<>();
                        c.put("fieldId", cond.has("fieldId") ? cond.get("fieldId").asText() : "");
                        c.put("operator", cond.has("operator") ? cond.get("operator").asText() : "");
                        c.put("value", cond.has("value") ? parseValue(cond.get("value")) : "");
                        conditions.add(c);
                    }
                }

                String logicOp = data != null && data.has("logicOp") ? data.get("logicOp").asText() : "&&";

                sb.append("// ◆ 条件分流\n");

                List<String> branches = new ArrayList<>();
                for (int i = 0; i < outEdges.size(); i++) {
                    JsonNode edge = outEdges.get(i);
                    String targetId = edge.get("target").asText();
                    String label = edge.has("data") && edge.get("data").has("label")
                            ? edge.get("data").get("label").asText() : "分支" + (i + 1);

                    String condStr = "true";
                    if (i < conditions.size()) {
                        Map<String, Object> cond = conditions.get(i);
                        condStr = buildConditionQL(cond, fieldTypeMap, fieldNameMap);
                    }

                    String subExpr = buildBranch(targetId, nodeMap, edges, fieldTypeMap, fieldNameMap, new HashSet<>(visited));

                    String keyword = i == 0 ? "if" : "else if";
                    branches.add(keyword + "(" + condStr + ") { " + subExpr + " /* " + label + " */ }");
                }

                sb.append(String.join(" ", branches));
                break;
            }
            case "calculate": {
                sb.append("// ★ 积分计算\n");
                String calcExpr = buildCalculateQL(data, fieldNameMap);
                sb.append("point = ").append(calcExpr).append(";");

                if (!outEdges.isEmpty()) {
                    String targetId = outEdges.get(0).get("target").asText();
                    sb.append(buildBranch(targetId, nodeMap, edges, fieldTypeMap, fieldNameMap, visited));
                }
                break;
            }
            case "no_points": {
                sb.append("// ⊘ 无积分拦截\n");
                sb.append("point = 0;");

                if (!outEdges.isEmpty()) {
                    String targetId = outEdges.get(0).get("target").asText();
                    sb.append(buildBranch(targetId, nodeMap, edges, fieldTypeMap, fieldNameMap, visited));
                }
                break;
            }
            case "deduction": {
                sb.append("// − 积分扣减\n");
                sb.append("point = point;");

                if (!outEdges.isEmpty()) {
                    String targetId = outEdges.get(0).get("target").asText();
                    sb.append(buildBranch(targetId, nodeMap, edges, fieldTypeMap, fieldNameMap, visited));
                }
                break;
            }
            case "end": {
                sb.append("// ● 输出最终积分\n");
                sb.append("point;");
                break;
            }
        }

        return sb.toString();
    }

    private String buildConditionQL(Map<String, Object> cond, Map<String, String> fieldTypeMap,
                                     Map<String, String> fieldNameMap) {
        String fieldId = (String) cond.get("fieldId");
        String operator = (String) cond.get("operator");
        Object value = cond.get("value");

        if (fieldId == null || fieldId.isEmpty()) return "true";
        if (operator == null || operator.isEmpty()) return "true";

        String type = fieldTypeMap.getOrDefault(fieldId, "number");

        switch (operator) {
            case "in": {
                if (value instanceof List) {
                    List<?> vals = (List<?>) value;
                    if (vals.isEmpty()) return "true";
                    String joined = vals.stream()
                            .map(v -> isNumeric(v) ? String.valueOf(v) : "\"" + v + "\"")
                            .collect(Collectors.joining(","));
                    return "in(" + fieldId + ",[" + joined + "])";
                }
                return "true";
            }
            case "notIn": {
                if (value instanceof List) {
                    List<?> vals = (List<?>) value;
                    if (vals.isEmpty()) return "true";
                    String joined = vals.stream()
                            .map(v -> isNumeric(v) ? String.valueOf(v) : "\"" + v + "\"")
                            .collect(Collectors.joining(","));
                    return "!in(" + fieldId + ",[" + joined + "])";
                }
                return "true";
            }
            default: {
                if ("boolean".equals(type)) {
                    boolean boolVal = "true".equals(String.valueOf(value)) || Boolean.TRUE.equals(value);
                    return fieldId + " == " + boolVal;
                }
                if ("number".equals(type)) {
                    return fieldId + " " + operator + " " + value;
                }
                if ("date".equals(type)) {
                    return fieldId + " " + operator + " \"" + value + "\"";
                }
                // enum or text
                return fieldId + " " + operator + " \"" + value + "\"";
            }
        }
    }

    private String buildCalculateQL(JsonNode data, Map<String, String> fieldNameMap) {
        if (data == null) return "0";

        String pointRatio = data.has("pointRatio") ? data.get("pointRatio").asText() : "1元1分";

        Map<String, Double> ratioMap = new HashMap<>();
        ratioMap.put("1元1分", 1.0);
        ratioMap.put("10元1分", 0.1);
        ratioMap.put("20元1分", 0.05);

        double ratio = ratioMap.getOrDefault(pointRatio, 1.0);
        String expr = "tradeAmt * " + ratio;

        String multiplierSource = data.has("multiplierSource") ? data.get("multiplierSource").asText() : "fixed";
        if ("field".equals(multiplierSource) && data.has("multiplierFieldId")) {
            String fieldId = data.get("multiplierFieldId").asText();
            expr = expr + " * " + fieldId;
        } else if (data.has("multiplier")) {
            expr = expr + " * " + data.get("multiplier").asDouble();
        }

        String maxPointsSource = data.has("maxPointsSource") ? data.get("maxPointsSource").asText() : "none";
        if ("field".equals(maxPointsSource) && data.has("maxPointsFieldId")) {
            String fieldId = data.get("maxPointsFieldId").asText();
            expr = "min(" + expr + ", " + fieldId + ")";
        } else if ("fixed".equals(maxPointsSource) && data.has("maxPoints")) {
            expr = "min(" + expr + ", " + data.get("maxPoints").asDouble() + ")";
        }

        return expr;
    }

    private Object parseValue(JsonNode node) {
        if (node == null) return "";
        if (node.isArray()) {
            List<String> list = new ArrayList<>();
            for (JsonNode item : node) {
                list.add(item.asText());
            }
            return list;
        }
        if (node.isBoolean()) return node.asBoolean();
        if (node.isNumber()) return node.asDouble();
        return node.asText();
    }

    private boolean isNumeric(Object obj) {
        if (obj == null) return false;
        try {
            Double.parseDouble(obj.toString());
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
