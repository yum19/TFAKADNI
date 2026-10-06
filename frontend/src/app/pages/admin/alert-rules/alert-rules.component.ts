import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertRule } from '../../../core/models/pregnancy.model';
import { AlertRuleService } from '../../../core/services/alert-rule.service';

@Component({
  selector: 'app-alert-rules',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule, MatSlideToggleModule,
    ReactiveFormsModule,
  ],
  templateUrl: './alert-rules.html',
  styleUrl: './alert-rules.scss'
})
export class AlertRulesComponent implements OnInit {

  rules: AlertRule[] = [];
  loading = true;
  saving = false;

  totalRules = 0;
  totalActive = 0;

  showForm = false;
  showEditForm = false;
  selectedRule: AlertRule | null = null;
  showDeleteRuleConfirm = false;
ruleToDelete: AlertRule | null = null;
  ruleForm: FormGroup;
  editForm: FormGroup;

  metrics = [
    { value: 'SYSTOLIC_BP',   label: 'Systolic blood pressure (mmHg)' },
    { value: 'DIASTOLIC_BP',  label: 'Diastolic blood pressure (mmHg)' },
    { value: 'WEIGHT_KG',     label: 'Weight (kg)' },
    { value: 'HEART_RATE',    label: 'Heart rate (bpm)' },
    { value: 'GLUCOSE_MMOL',  label: 'Glucose (mmol/L)' },
    { value: 'TEMPERATURE_C', label: 'Temperature (°C)' },
    { value: 'OXYGEN_PCT',    label: 'Oxygen (%)' },
  ];

  operators = [
    { value: 'GT',  label: '> Greater than' },
    { value: 'GTE', label: '>= Greater than or equal to' },
    { value: 'LT',  label: '< Less than' },
    { value: 'LTE', label: '<= Less than or equal to' },
    { value: 'EQ',  label: '= Equal to' },
  ];

  severities = [
    { value: 'INFO',     label: 'Info' },
    { value: 'WARNING',  label: 'Warning' },
    { value: 'DANGER',   label: 'Danger' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  constructor(
    private alertRuleService: AlertRuleService,
    private fb: FormBuilder
  ) {
    const formFields = {
      label:       ['', Validators.required],
      metric:      ['SYSTOLIC_BP', Validators.required],
      operator:    ['GT', Validators.required],
      threshold:   [null, [Validators.required, Validators.min(0)]],
      severity:    ['WARNING', Validators.required],
      notifMethod: ['push'],
      active:      [true],
    };
    this.ruleForm = this.fb.group(formFields);
    this.editForm = this.fb.group(formFields);
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.alertRuleService.getAllAdmin().subscribe({
      next: (list) => {
        this.rules = list;
        this.totalRules = list.length;
        this.totalActive = list.filter(r => r.active).length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ===== ADD =====
  openForm() {
    this.ruleForm.reset({
      metric: 'SYSTOLIC_BP', operator: 'GT',
      severity: 'WARNING', notifMethod: 'push', active: true
    });
    this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  save() {
    if (this.ruleForm.invalid) return;
    this.saving = true;
    this.alertRuleService.createRule(this.ruleForm.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.loadAll(); },
      error: () => { this.saving = false; }
    });
  }

  // ===== EDIT =====
  openEditForm(rule: AlertRule) {
    this.selectedRule = rule;
    this.editForm.patchValue({
      label:       rule.label,
      metric:      rule.metric,
      operator:    rule.operator,
      threshold:   rule.threshold,
      severity:    rule.severity,
      notifMethod: rule.notifMethod || 'push',
      active:      rule.active,
    });
    this.showEditForm = true;
  }
  closeEditForm() { this.showEditForm = false; this.selectedRule = null; }

  saveEdit() {
    if (this.editForm.invalid || !this.selectedRule) return;
    this.saving = true;
    this.alertRuleService.updateRule(this.selectedRule.id, this.editForm.value).subscribe({
      next: () => { this.saving = false; this.closeEditForm(); this.loadAll(); },
      error: () => { this.saving = false; }
    });
  }

  // ===== TOGGLE =====
  toggleRule(rule: AlertRule) {
    this.alertRuleService.toggleRule(rule.id).subscribe({
      next: () => { this.loadAll(); },
      error: () => {}
    });
  }

  // ===== DELETE =====
deleteRule(rule: AlertRule) {
  this.ruleToDelete = rule;
  this.showDeleteRuleConfirm = true;
}

confirmDeleteRule() {
  if (!this.ruleToDelete) return;
  this.showDeleteRuleConfirm = false;
  this.alertRuleService.deleteRule(this.ruleToDelete.id).subscribe({
    next: () => { this.ruleToDelete = null; this.loadAll(); },
    error: () => { this.ruleToDelete = null; }
  });
}

  getMetricLabel(m: string): string {
    return this.metrics.find(x => x.value === m)?.label || m;
  }

  getOperatorLabel(o: string): string {
    return this.operators.find(x => x.value === o)?.label || o;
  }

  getSeverityColor(s: string): string {
    const m: any = { INFO: '#03a9f4', WARNING: '#ff9800', DANGER: '#f44336', CRITICAL: '#9c27b0' };
    return m[s] || '#999';
  }

  getSeverityIcon(s: string): string {
    const m: any = { INFO: 'info', WARNING: 'warning', DANGER: 'error', CRITICAL: 'crisis_alert' };
    return m[s] || 'notifications';
  }
}