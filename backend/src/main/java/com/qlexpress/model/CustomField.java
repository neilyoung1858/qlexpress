package com.qlexpress.model;

import java.util.List;

public class CustomField {
    private String id;
    private String name;
    private String type;
    private String category;
    private String status;
    private List<String> preset;

    public CustomField() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getPreset() { return preset; }
    public void setPreset(List<String> preset) { this.preset = preset; }
}
