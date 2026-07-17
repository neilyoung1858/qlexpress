package com.qlexpress.service;

import com.qlexpress.model.CustomField;
import com.qlexpress.model.Rule;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class RuleService {
    private final Map<String, Rule> rules = new ConcurrentHashMap<>();

    public Rule save(Rule rule) {
        if (rule.getId() == null || rule.getId().isEmpty()) {
            rule.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        }
        rule.setCreatedAt(LocalDateTime.now());
        rule.setUpdatedAt(LocalDateTime.now());
        rules.put(rule.getId(), rule);
        return rule;
    }

    public Rule update(String id, Rule rule) {
        Rule existing = rules.get(id);
        if (existing != null) {
            rule.setId(id);
            rule.setCreatedAt(existing.getCreatedAt());
            rule.setUpdatedAt(LocalDateTime.now());
            rules.put(id, rule);
            return rule;
        }
        return null;
    }

    public Rule findById(String id) {
        return rules.get(id);
    }

    public List<Rule> findAll() {
        return new ArrayList<>(rules.values()).stream()
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    public void delete(String id) {
        rules.remove(id);
    }
}
