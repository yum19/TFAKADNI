import { Routes } from '@angular/router';

import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { FullLayoutComponent } from './layouts/full-layout/full-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'landing', loadComponent: () => import('./pages/auth/landing/landing.component').then(m => m.LandingComponent) },
      { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'signup', loadComponent: () => import('./pages/auth/signup/signup.component').then(m => m.SignupComponent) },
      { path: 'signup-success', loadComponent: () => import('./pages/auth/signup-success/signup-success.component').then(m => m.SignupSuccessComponent) },
      { path: 'oauth2/callback', loadComponent: () => import('./pages/auth/oauth2-callback/oauth2-callback.component').then(m => m.OAuth2CallbackComponent) },
      { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'change-password', loadComponent: () => import('./pages/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent) }
    ]
  },
  {
    path: 'mother',
    component: FrontLayoutComponent,
    canActivate: [roleGuard(['USER'])],
    children: [
      // Your Core Mother Pages
      { path: 'home', loadComponent: () => import('./pages/front/mother/home/home.component').then(m => m.MotherHomeComponent) },
      { path: 'courses', loadComponent: () => import('./pages/front/mother/courses/courses.component').then(m => m.MotherCoursesComponent) },
      { path: 'courses/:id', loadComponent: () => import('./pages/front/mother/course-detail/course-detail.component').then(m => m.MotherCourseDetailComponent) },
      { path: 'enrollments', loadComponent: () => import('./pages/front/mother/enrollments/enrollments.component').then(m => m.MotherEnrollmentsComponent) },
      { path: 'recommendations', loadComponent: () => import('./pages/front/mother/recommendations/recommendations.component').then(m => m.MotherRecommendationsComponent) },
      { path: 'notifications', loadComponent: () => import('./pages/front/mother/notifications/notifications.component').then(m => m.MotherNotificationsComponent) },
      { path: 'notes', loadComponent: () => import('./pages/front/mother/notes/notes.component').then(m => m.MotherNotesComponent) },
      { path: 'collaboration', loadComponent: () => import('./pages/front/mother/collaboration/collaboration.component').then(m => m.MotherCollaborationComponent) },
      { path: 'ai', loadComponent: () => import('./pages/front/mother/ai/ai.component').then(m => m.MotherAiComponent) },
      
      // His Migrated Mother Pages (Now running inside your Navbar Layout)
      { path: 'health-profile', loadComponent: () => import('./pages/front/mother/health-profile/health-profile.component').then(m => m.HealthProfileComponent) },
      { path: 'subscription', loadComponent: () => import('./pages/front/mother/subscription/subscription.component').then(m => m.SubscriptionComponent) },
      { path: 'face-id', loadComponent: () => import('./pages/front/mother/face-id/face-id.component').then(m => m.FaceIdComponent) },
      { path: 'emotion-detector', loadComponent: () => import('./pages/front/mother/emotion-detector/emotion-detector.component').then(m => m.EmotionDetectorComponent) },
      { path: 'phase-predictor', loadComponent: () => import('./pages/front/mother/phase-predictor/phase-predictor.component').then(m => m.PhasePredictorComponent) },
      { path: 'medical-card', loadComponent: () => import('./pages/front/mother/medical-card/medical-card.component').then(m => m.MedicalCardComponent) },
      { path: 'maternities', loadComponent: () => import('./pages/front/mother/maternities/maternities.component').then(m => m.MaternitiesComponent) },
      { path: 'ai-health', loadComponent: () => import('./pages/front/mother/ai-health/ai-health.component').then(m => m.AiHealthComponent) },
      
      // His Migrated Payment Pages
      { path: 'payment/simulate', loadComponent: () => import('./pages/front/mother/payment/payment-simulate.component').then(m => m.PaymentSimulateComponent) },
      { path: 'payment/success', loadComponent: () => import('./pages/front/mother/payment/payment-success.component').then(m => m.PaymentSuccessComponent) },
      { path: 'payment/cancel', loadComponent: () => import('./pages/front/mother/payment/payment-cancel.component').then(m => m.PaymentCancelComponent) },

      {
        path: 'pregnancy',
        loadComponent: () => import('./pages/front/mother/pregnancy/pregnancy.component').then(m => m.PregnancyComponent)
      },
      {
        path: 'pregnancy-dashboard',
        loadComponent: () => import('./pages/front/mother/dashboard/pregnancy-dashboard.component').then(m => m.PregnancyDashboardComponent)
      },
      {
        path: 'vitals',
        loadComponent: () => import('./pages/front/mother/vitals/vitals.component').then(m => m.VitalsComponent)
      },
      {
        path: 'exams',
        loadComponent: () => import('./pages/front/mother/exams/exams.component').then(m => m.ExamsComponent)
      },
      {
        path: 'fetal',
        loadComponent: () => import('./pages/front/mother/fetal/fetal.component').then(m => m.FetalComponent)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./pages/front/mother/alerts/alerts.component').then(m => m.AlertsComponent)
      },
      { path: 'profile', loadComponent: () => import('./pages/front/mother/mother-profile.component').then(m => m.MotherProfileComponent) },
      { path: 'referral', loadComponent: () => import('./pages/front/mother/mother-referral.component').then(m => m.MotherReferralComponent) },

      // --- INTEGRATED FROM IKBEL (MOTHER / WEBSITE) ---
      { path: 'babies', loadComponent: () => import('./pages/front/mother/babies/babies.component').then(c => c.BabiesComponent) },
      { path: 'postpartum', pathMatch: 'full', loadComponent: () => import('./pages/front/mother/module6b/home-postpartum/home-postpartum.component').then(c => c.HomePostpartumComponent) },
      { path: 'postpartum/screening-assessment', loadComponent: () => import('./pages/front/mother/module6b/screening-assessment/screening-assessment.component').then(c => c.ScreeningAssessmentComponent) },
      { path: 'postpartum/contraception', loadComponent: () => import('./pages/front/mother/module6b/contraception/contraception.component').then(c => c.ContraceptionComponent) },
      { path: 'postpartum/contraception/recommandation', loadComponent: () => import('./pages/front/mother/module6b/recommandation-contraception/recommandation-contraception.component').then(c => c.RecommandationContraceptionComponent) },
      { path: 'postpartum/contraception/methode', loadComponent: () => import('./pages/front/mother/module6b/methode-contraception/methode-contraception.component').then(c => c.MethodeContraceptionComponent) },
      { path: 'postpartum/mood-log', loadComponent: () => import('./pages/front/mother/module6b/mood-log/mood-log.component').then(c => c.MoodLogComponent) },
      { path: 'postpartum/predictions', loadComponent: () => import('./pages/front/mother/module6b/prediction-result/prediction-result.component').then(c => c.PredictionResultComponent) },
      { path: 'postpartum/appointments', loadComponent: () => import('./pages/front/mother/module6b/psych-appointment/psych-appointment.component').then(c => c.PsychAppointmentComponent) },
      { path: 'postpartum/storytelling', loadComponent: () => import('./pages/front/mother/module6b/storytelling-popup/storytelling-popup.component').then(c => c.StorytellingPopupComponent) },
      { path: 'postpartum/healing-missions', loadComponent: () => import('./pages/front/mother/module6b/healing-missions/healing-missions.component').then(c => c.HealingMissionsComponent) },
      { path: 'postpartum/screenings', loadComponent: () => import('./pages/front/mother/module6b/screening-assessment/screening-assessment.component').then(c => c.ScreeningAssessmentComponent) },
      { path: 'postpartum/resources', loadComponent: () => import('./pages/front/mother/module6b/support-resource/support-resource.component').then(c => c.SupportResourceComponent) },
      { path: 'baby-profiles', loadComponent: () => import('./pages/front/mother/baby-profiles/baby-profiles.component').then(c => c.BabyProfilesComponent) },
      { path: 'babies/:babyId', loadComponent: () => import('./pages/front/mother/module6a/baby-detail.component').then(c => c.BabyDetailComponent) },
      { path: 'babies/:babyId/growth', loadComponent: () => import('./pages/front/mother/module6a/growth/growth.component').then(c => c.GrowthComponent) },
      { path: 'babies/:babyId/feeding', loadComponent: () => import('./pages/front/mother/module6a/feeding/feeding.component').then(c => c.FeedingComponent) },
      { path: 'babies/:babyId/sleep', loadComponent: () => import('./pages/front/mother/module6a/sleep-log/sleep-log.component').then(c => c.SleepLogComponent) },
      { path: 'babies/:babyId/diapers', loadComponent: () => import('./pages/front/mother/module6a/diaper-log/diaper-log.component').then(c => c.DiaperLogComponent) },
      { path: 'babies/:babyId/vaccines', loadComponent: () => import('./pages/front/mother/module6a/vaccine/vaccine.component').then(c => c.VaccineComponent) },
      { path: 'babies/:babyId/appointments', loadComponent: () => import('./pages/front/mother/module6a/appointment/appointment.component').then(c => c.AppointmentComponent) },
      { path: 'babies/:babyId/milestones', loadComponent: () => import('./pages/front/mother/module6a/milestone/milestone.component').then(c => c.MilestoneComponent) },
      { path: 'babies/:babyId/documents', loadComponent: () => import('./pages/front/mother/module6a/document/document.component').then(c => c.DocumentComponent) },
      { path: 'babies/:babyId/reminders', loadComponent: () => import('./pages/front/mother/module6a/reminder/reminder.component').then(c => c.ReminderComponent) },
      { path: 'babies/:babyId/insights', loadComponent: () => import('./pages/front/mother/module6a/insight/insight.component').then(c => c.InsightComponent) },
      { path: 'babies/:babyId/rhythm', loadComponent: () => import('./pages/front/mother/module6a/rhythm/rhythm.component').then(c => c.RhythmComponent) },
      { path: 'babies/:babyId/timeline', loadComponent: () => import('./pages/front/mother/module6a/timeline/timeline.component').then(c => c.TimelineComponent) },
      { path: 'babies/:babyId/today-summary', loadComponent: () => import('./pages/front/mother/module6a/today-summary/today-summary.component').then(c => c.TodaySummaryComponent) },
      { path: 'babies/:babyId/care-score', loadComponent: () => import('./pages/front/mother/module6a/care-score/care-score.component').then(c => c.CareScoreComponent) },
      { path: 'babies/:babyId/teething', loadComponent: () => import('./pages/front/mother/module6a/teething-log/teething-log.component').then(c => c.TeethingLogComponent) },
      { path: 'add-baby', loadComponent: () => import('./pages/front/mother/add-babies/add-babies').then(c => c.AddBabies) },
      { path: 'add-baby-size', loadComponent: () => import('./pages/front/mother/add-baby-size/add-baby-size').then(c => c.AddBabySize) },


      //module 5//
      { path: "communaute/chat",         loadComponent: () => import("./pages/module5/_front/communaute/chat/chat").then(m => m.Chat) },
            { path: "shop",                    loadComponent: () => import("./pages/module5/_front/boutique/boutique").then(m => m.Boutique) },
            { path: "shop/product/:id",        loadComponent: () => import("./pages/module5/_front/detail-produit/produit-detail").then(m => m.ProduitDetail) },
            { path: "shop/cart",               loadComponent: () => import("./pages/module5/_front/panier/panier").then(m => m.Panier) },
            { path: "shop/order",              loadComponent: () => import("./pages/module5/_front/commande/commande").then(m => m.Commande) },

            // ── NEW: Stripe redirect targets ──────────────────────────────
            {
                path: "shop/order-success",
                loadComponent: () => import("./pages/module5/_front/order-success/order-success.component")
                    .then(m => m.OrderSuccessComponent),
            },
            {
                path: "shop/order-cancel",
                loadComponent: () => import("./pages/module5/_front/order-cancel/order-cancel.component")
                    .then(m => m.OrderCancelComponent),
            },
            // ─────────────────────────────────────────────────────────────

            { path: "communaute",              loadComponent: () => import("./pages/module5/_front/communaute/liste-posts/liste-posts").then(m => m.ListePosts) },
            { path: "communaute/creer-post",   loadComponent: () => import("./pages/module5/_front/communaute/creer-post/creer-post").then(m => m.CreerPost) },
            { path: "communaute/saved",        loadComponent: () => import("./pages/module5/_front/communaute/saved-posts/saved-posts.component").then(m => m.SavedPostsComponent) },
            { path: "communaute/create-story", loadComponent: () => import("./pages/module5/_front/communaute/create-story/create-story").then(m => m.CreateStory) },
            { path: "communaute/people",       loadComponent: () => import("./pages/module5/_front/communaute/people/people.component").then(m => m.PeopleComponent) },
            { path: "communaute/:id",          loadComponent: () => import("./pages/module5/_front/communaute/detail-post/detail-post").then(m => m.DetailPost) },
            { path: "marrainage",              loadComponent: () => import("./pages/module5/_front/marrainage/marrainage.component").then(m => m.MarrainageComponent) },
            { path: "mes-matches",             loadComponent: () => import("./pages/module5/_front/mes-matches/mes-matches.component").then(c => c.MesMatchesComponent) },
            { path: "spaces",                  loadComponent: () => import("./pages/module5/_front/communaute/spaces/spaces-list/spaces-list.component").then(c => c.SpacesListComponent) },

      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  {
    path: 'partner',
    component: FrontLayoutComponent,
    canActivate: [roleGuard(['PARTNER'])],
    children: [
      { path: 'home', loadComponent: () => import('./pages/front/partner/home/home.component').then(m => m.PartnerHomeComponent) },
      { path: 'invites', loadComponent: () => import('./pages/front/partner/invites/invites.component').then(m => m.PartnerInvitesComponent) },
      { path: 'notifications', loadComponent: () => import('./pages/front/partner/notifications/notifications.component').then(m => m.PartnerNotificationsComponent) },
      { path: 'notes', loadComponent: () => import('./pages/front/partner/notes/notes.component').then(m => m.PartnerNotesComponent) },
      { path: 'guides', loadComponent: () => import('./pages/front/partner/guides/guides.component').then(m => m.PartnerGuidesComponent) },
      { path: 'ai', loadComponent: () => import('./pages/front/partner/ai/ai.component').then(m => m.PartnerAiComponent) },
      {
        path: 'pregnancy',
        loadComponent: () => import('./pages/front/partner/pregnancy/pregnancy.component').then(m => m.PartnerPregnancyComponent)
      },
      {
        path: 'exams',
        loadComponent: () => import('./pages/front/partner/exams/exams.component').then(m => m.PartnerExamsComponent)
      },
      {
        path: 'fetal',
        loadComponent: () => import('./pages/front/partner/fetal/fetal.component').then(m => m.PartnerFetalComponent)
      },
      { 
        path: 'evo-care', 
        loadComponent: () => import('./pages/front/partner/evo-care/evo-care.component').then(m => m.EvoCareComponent) 
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [roleGuard(['ADMIN'])],
    children: [
      // Your Core Admin Pages
      { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'courses', loadComponent: () => import('./pages/admin/courses/courses.component').then(m => m.AdminCoursesComponent) },
      { path: 'studio', loadComponent: () => import('./pages/admin/studio/studio.component').then(m => m.AdminStudioComponent) },
      { path: 'guides', loadComponent: () => import('./pages/admin/guides/guides.component').then(m => m.AdminGuidesComponent) },

      // His Migrated Admin Pages
      { path: 'users', loadComponent: () => import('./pages/admin/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'plans', loadComponent: () => import('./pages/admin/admin-plans.component').then(m => m.AdminPlansComponent) },
      { path: 'promos', loadComponent: () => import('./pages/admin/admin-promos.component').then(m => m.AdminPromosComponent) },
      { path: 'reports', loadComponent: () => import('./pages/admin/admin-reports.component').then(m => m.AdminReportsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/admin/admin-settings.component').then(m => m.AdminSettingsComponent) },
      { path: 'profile', loadComponent: () => import('./pages/admin/admin-profile.component').then(m => m.AdminProfileComponent) },
      {
        path: 'pregnancies',
        loadComponent: () => import('./pages/admin/pregnancies/pregnancies.component').then(m => m.PregnanciesComponent)
      },
      {
        path: 'vitals-admin',
        loadComponent: () => import('./pages/admin/vitals-admin/vitals-admin.component').then(m => m.VitalsAdminComponent)
      },
      {
        path: 'exams-admin',
        loadComponent: () => import('./pages/admin/exams-admin/exams-admin.component').then(m => m.ExamsAdminComponent)
      },
      {
        path: 'fetal-admin',
        loadComponent: () => import('./pages/admin/fetal-admin/fetal-admin.component').then(m => m.FetalAdminComponent)
      },
      {
        path: 'alerts-admin',
        loadComponent: () => import('./pages/admin/alerts-admin/alerts-admin.component').then(m => m.AlertsAdminComponent)
      },
      {
        path: 'alert-rules',
        loadComponent: () => import('./pages/admin/alert-rules/alert-rules.component').then(m => m.AlertRulesComponent)
      },

      // --- INTEGRATED FROM IKBEL (ADMIN / APP) ---
      { path: 'support-resource', loadComponent: () => import('./pages/admin/support-resource/support-resource.component').then(c => c.SupportResourceComponent) },
      { path: 'screening-analytics', loadComponent: () => import('./pages/admin/screening-analytics/screening-analytics.component').then(c => c.ScreeningAnalyticsComponent) },
      { path: 'follow-up-analytics', loadComponent: () => import('./pages/admin/follow-up-analytics/follow-up-analytics.component').then(c => c.FollowUpAnalyticsComponent) },
      { path: 'contraception-analytics', loadComponent: () => import('./pages/admin/contraception-analytics/contraception-analytics.component').then(c => c.ContraceptionAnalyticsComponent) },

      //module 5//
      { path: "community",         loadComponent: () => import('./pages/module5/_admin/admin-community/admin-community').then(m => m.AdminCommunityComponent) },
      { path: "shop/liste-produits",    loadComponent: () => import("./pages/module5/_admin/liste-produits/liste-produits").then(m => m.ListeProduits) },
      { path: "shop/creer-produit",     loadComponent: () => import("./pages/module5/_admin/creer-produits/creer-produits").then(m => m.CreerProduit) },
      { path: "shop/product/:id",       loadComponent: () => import("./pages/module5/_admin/detail-produit/detail-produit").then(m => m.DetailProduit) },
      {path: 'go-live-admin',                loadComponent: () =>import('./pages/module5/_admin/liste-posts-admin/liste-posts-admin').then(m => m.ListePostsAdmin)},


      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: FullLayoutComponent,
    children: [
      { path: 'coming-soon', loadComponent: () => import('./pages/full/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent) },
      { path: '404', loadComponent: () => import('./pages/full/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent) },
    ]
  },
  { path: '**', redirectTo: '404' }
];
