package com.qlexpress.controller;

import com.qlexpress.model.Rule;
import com.qlexpress.service.QlGeneratorService;
import com.qlexpress.service.RuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rules")
public class RuleController {

    @Autowired
    private RuleService ruleService;

    @Autowired
    private QlGeneratorService qlGeneratorService;

    @PostMapping
    public ResponseEntity<Rule> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.getOrDefault("name", "未命名规则");
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

        Rule rule = new Rule(null, name, canvasJson, qlExpression, null);
        Rule saved = ruleService.save(rule);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rule> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String name = (String) body.getOrDefault("name", "未命名规则");
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

        Rule rule = new Rule(id, name, canvasJson, qlExpression, null);
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
    public ResponseEntity<Rule> get(@PathVariable String id) {
        Rule rule = ruleService.findById(id);
        if (rule == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rule);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
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
}
