package com.qlexpress.model;

import java.time.LocalDateTime;
import java.util.List;

public class Rule {
    private String id;
    private String name;
    private String canvasJson;
    private String qlExpression;
    private List<CustomField> customFields;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Rule() {}

    public Rule(String id, String name, String canvasJson, String qlExpression, List<CustomField> customFields) {
        this.id = id;
        this.name = name;
        this.canvasJson = canvasJson;
        this.qlExpression = qlExpression;
        this.customFields = customFields;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCanvasJson() { return canvasJson; }
    public void setCanvasJson(String canvasJson) { this.canvasJson = canvasJson; }
    public String getQlExpression() { return qlExpression; }
    public void setQlExpression(String qlExpression) { this.qlExpression = qlExpression; }
    public List<CustomField> getCustomFields() { return customFields; }
    public void setCustomFields(List<CustomField> customFields) { this.customFields = customFields; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
