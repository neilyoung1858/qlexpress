package com.qlexpress.repository;

import com.qlexpress.model.Rule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleRepository extends JpaRepository<Rule, Long> {

    List<Rule> findAllByStatusOrderByUpdatedAtDesc(Integer status);
}
