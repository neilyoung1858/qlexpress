package com.qlexpress.controller;

import com.qlexpress.model.Rule;
import com.qlexpress.service.QLTestService;
import com.qlexpress.service.QlGeneratorService;
import com.qlexpress.service.RuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rules")
public class RuleController {

    @Autowired
    private RuleService ruleService;

    @Autowired
    private QlGeneratorService qlGeneratorService;

    @Autowired
    private QLTestService qlTestService;

    @PostMapping
    public ResponseEntity<Rule> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.getOrDefault("name", "未命名规则");
        String creator = (String) body.getOrDefault("creator", "admin");
        String canvasJson = (String) body.get("canvasJson");
        String qlExpression = (String) body.get("qlExpression");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> customFields = (List<Map<String, Object>>) body.get("customFields");

        if (canvasJson == null || canvasJson.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (qlExpression == null || qlExpression.isEmpty()) {
            qlExpression = qlGeneratorService.generate(canvasJson, customFields);
        }

        Rule rule = new Rule();
        rule.setName(name);
        rule.setCreator(creator);
        rule.setCanvasJson(canvasJson);
        rule.setQlExpression(qlExpression);

        if (customFields != null) {
            try {
                rule.setCustomFieldsJson(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(customFields));
            } catch (Exception ignored) {}
        }

        Rule saved = ruleService.save(rule);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rule> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String name = (String) body.getOrDefault("name", "未命名规则");
        String creator = (String) body.getOrDefault("creator", "admin");
        String canvasJson = (String) body.get("canvasJson");
        String qlExpression = (String) body.get("qlExpression");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> customFields = (List<Map<String, Object>>) body.get("customFields");

        if (canvasJson == null || canvasJson.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (qlExpression == null || qlExpression.isEmpty()) {
            qlExpression = qlGeneratorService.generate(canvasJson, customFields);
        }

        Rule rule = new Rule();
        rule.setName(name);
        rule.setCreator(creator);
        rule.setCanvasJson(canvasJson);
        rule.setQlExpression(qlExpression);

        if (customFields != null) {
            try {
                rule.setCustomFieldsJson(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(customFields));
            } catch (Exception ignored) {}
        }

        Rule updated = ruleService.update(id, rule);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<Rule>> list() {
        return ResponseEntity.ok(ruleService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rule> get(@PathVariable Long id) {
        Optional<Rule> rule = ruleService.findById(id);
        return rule.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ruleService.delete(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/generate-ql")
    public ResponseEntity<Map<String, String>> generateQl(@RequestBody Map<String, Object> body) {
        String canvasJson = (String) body.get("canvasJson");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> customFields = (List<Map<String, Object>>) body.get("customFields");
        String ql = qlGeneratorService.generate(canvasJson, customFields);
        return ResponseEntity.ok(Map.of("qlExpression", ql));
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> test(@RequestBody Map<String, Object> body) {
        Object ruleIdObj = body.get("ruleId");
        @SuppressWarnings("unchecked")
        Map<String, Object> params = (Map<String, Object>) body.get("params");

        if (ruleIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "ruleId is required"));
        }

        Long ruleId;
        if (ruleIdObj instanceof Number) {
            ruleId = ((Number) ruleIdObj).longValue();
        } else {
            try {
                ruleId = Long.parseLong(ruleIdObj.toString());
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "invalid ruleId"));
            }
        }

        Optional<Rule> ruleOpt = ruleService.findById(ruleId);
        if (ruleOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "rule not found"));
        }

        String qlExpression = ruleOpt.get().getQlExpression();
        if (qlExpression == null || qlExpression.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "rule has no qlExpression"));
        }

        Map<String, Object> result = qlTestService.executeWithShort(qlExpression, params);
        return ResponseEntity.ok(result);
    }
}
