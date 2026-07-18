package com.qlexpress.service;

import com.alibaba.qlexpress4.Express4Runner;
import com.alibaba.qlexpress4.InitOptions;
import com.alibaba.qlexpress4.QLOptions;
import com.alibaba.qlexpress4.QLResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class QLTestService {

    private static final Logger log = LoggerFactory.getLogger(QLTestService.class);
    private final Express4Runner runner;

    public QLTestService() {
        this.runner = new Express4Runner(InitOptions.DEFAULT_OPTIONS);
    }

    public Map<String, Object> execute(String qlExpression, Map<String, Object> params) {
        Map<String, Object> result = new HashMap<>();
        try {
            log.debug("Executing QL: {}", qlExpression);
            log.debug("Context: {}", params);

            QLResult qlResult = runner.execute(qlExpression, params, QLOptions.DEFAULT_OPTIONS);

            result.put("success", true);
            result.put("result", qlResult.getResult());
            return result;
        } catch (Exception e) {
            log.error("QL execution failed", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }

    public Map<String, Object> executeWithShort(String qlExpression, Map<String, Object> params) {
        if (qlExpression == null) {
            return Map.of("success", false, "error", "qlExpression is null");
        }
        String shortExpr = qlExpression.replaceAll("//.*", "").replaceAll("\\s+", " ").trim();
        return execute(shortExpr, params);
    }
}
