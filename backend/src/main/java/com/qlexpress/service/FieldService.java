package com.qlexpress.service;

import com.qlexpress.model.CustomField;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class FieldService {
    private final Map<String, CustomField> fields = new ConcurrentHashMap<>();

    public CustomField add(CustomField field) {
        if (field.getId() == null || field.getId().isEmpty()) {
            field.setId("cf_" + System.currentTimeMillis());
        }
        if (field.getStatus() == null) {
            field.setStatus("active");
        }
        fields.put(field.getId(), field);
        return field;
    }

    public CustomField update(String id, CustomField field) {
        if (fields.containsKey(id)) {
            field.setId(id);
            fields.put(id, field);
            return field;
        }
        return null;
    }

    public CustomField findById(String id) {
        return fields.get(id);
    }

    public List<CustomField> findAll() {
        return new ArrayList<>(fields.values());
    }

    public List<CustomField> findActive() {
        return fields.values().stream()
                .filter(f -> "active".equals(f.getStatus()))
                .collect(Collectors.toList());
    }

    public void deactivate(String id) {
        CustomField field = fields.get(id);
        if (field != null) {
            field.setStatus("inactive");
        }
    }

    public void delete(String id) {
        fields.remove(id);
    }
}
