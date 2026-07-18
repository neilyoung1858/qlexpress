package com.qlexpress.service;

import com.qlexpress.model.Rule;
import com.qlexpress.repository.RuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RuleService {

    @Autowired
    private RuleRepository ruleRepository;

    public Rule save(Rule rule) {
        if (rule.getVersion() == null) {
            rule.setVersion(1);
        }
        if (rule.getCreator() == null) {
            rule.setCreator("admin");
        }
        if (rule.getStatus() == null) {
            rule.setStatus(1);
        }
        return ruleRepository.save(rule);
    }

    public Rule update(Long id, Rule rule) {
        Optional<Rule> existing = ruleRepository.findById(id);
        if (existing.isEmpty()) {
            return null;
        }
        Rule old = existing.get();
        rule.setId(id);
        rule.setCreatedAt(old.getCreatedAt());
        rule.setVersion(old.getVersion() + 1);
        if (rule.getCreator() == null) {
            rule.setCreator(old.getCreator());
        }
        if (rule.getStatus() == null) {
            rule.setStatus(old.getStatus());
        }
        return ruleRepository.save(rule);
    }

    public Optional<Rule> findById(Long id) {
        return ruleRepository.findById(id);
    }

    public List<Rule> findAll() {
        return ruleRepository.findAllByStatusOrderByUpdatedAtDesc(1);
    }

    public void delete(Long id) {
        ruleRepository.deleteById(id);
    }
}
