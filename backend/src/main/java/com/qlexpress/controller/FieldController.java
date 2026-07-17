package com.qlexpress.controller;

import com.qlexpress.model.CustomField;
import com.qlexpress.service.FieldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fields")
public class FieldController {

    @Autowired
    private FieldService fieldService;

    @PostMapping
    public ResponseEntity<CustomField> create(@RequestBody CustomField field) {
        return ResponseEntity.ok(fieldService.add(field));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomField> update(@PathVariable String id, @RequestBody CustomField field) {
        CustomField updated = fieldService.update(id, field);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<CustomField>> list(@RequestParam(required = false) boolean activeOnly) {
        if (activeOnly) {
            return ResponseEntity.ok(fieldService.findActive());
        }
        return ResponseEntity.ok(fieldService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomField> get(@PathVariable String id) {
        CustomField field = fieldService.findById(id);
        if (field == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(field);
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable String id) {
        fieldService.deactivate(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        fieldService.delete(id);
        return ResponseEntity.ok().build();
    }
}
