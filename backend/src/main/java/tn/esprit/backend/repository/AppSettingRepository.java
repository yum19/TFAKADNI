package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.AppSetting;

public interface AppSettingRepository extends JpaRepository<AppSetting, String> {}