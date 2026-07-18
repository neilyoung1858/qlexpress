package com.qlexpress.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ql_rule")
public class Rule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_name", length = 100, nullable = false)
    private String name;

    @Column(name = "canvas_json", columnDefinition = "LONGTEXT")
    private String canvasJson;

    @Column(name = "ql_expression", columnDefinition = "TEXT")
    private String qlExpression;

    @Column(name = "custom_fields_json", columnDefinition = "TEXT")
    private String customFieldsJson;

    @Column(name = "version")
    private Integer version = 1;

    @Column(name = "creator", length = 50)
    private String creator = "admin";

    @Column(name = "remark", length = 500)
    private String remark;

    @Column(name = "status", nullable = false)
    private Integer status = 1;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Rule() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCanvasJson() { return canvasJson; }
    public void setCanvasJson(String canvasJson) { this.canvasJson = canvasJson; }
    public String getQlExpression() { return qlExpression; }
    public void setQlExpression(String qlExpression) { this.qlExpression = qlExpression; }
    public String getCustomFieldsJson() { return customFieldsJson; }
    public void setCustomFieldsJson(String customFieldsJson) { this.customFieldsJson = customFieldsJson; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getCreator() { return creator; }
    public void setCreator(String creator) { this.creator = creator; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
