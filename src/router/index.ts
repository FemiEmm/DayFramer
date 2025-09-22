// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { supabase } from "@/lib/supabase";

import HomePage from "@/components/HomePage/HomePage.vue";
import DayFramer from "@/components/DayFramer/DayFramer.vue";
import DayView from "@/components/DayFramer/DayView.vue";
import DashBoard from "@/components/DashBoard.vue";
import MonthlyView from "@/components/Monthly/MonthlyView.vue";
import TeamManagementPage from "@/components/Monthly/TeamManagementPage.vue";
import OnBoardingPage from "@/components/Onboarding/OnBoardingPage.vue";
import WelcomePage from "@/components/AuthPage/WelcomePage.vue";
import WIPPage from "@/components/WorkInProgress/WorkInProgress.vue";
import NotFound from "@/components/WorkInProgress/NotFound.vue";
import SettingsPage from "@/components/SettingsPage/SettingsPage.vue";
import PlanPage from "@/components/Todo/PlanPage.vue";

const routes: Array<RouteRecordRaw> = [
  { path: "/", name: "Welcome", component: WelcomePage },

  // Auth
  { path: "/auth/callback", name: "AuthCallback", component: () => import("@/components/AuthPage/AuthCallback.vue") },
  { path: "/forgot-password", name: "ForgotPassword", component: () => import("@/components/AuthPage/ForgotPassword.vue") },

  // Aliases to Welcome with a mode param
  { path: "/signin",  name: "SignIn",  redirect: (to) => ({ path: "/", query: { ...to.query, mode: "signin" } }) },
  { path: "/signup",  name: "SignUp",  redirect: (to) => ({ path: "/", query: { ...to.query, mode: "signup" } }) },
  { path: "/welcome", name: "WelcomeAlias", redirect: (to) => ({ path: "/", query: to.query }) },

  // App pages
  { path: "/home", name: "Homepage", component: HomePage, meta: { requiresAuth: true } },
  { path: "/about", name: "About", component: () => import("@/views/AboutView.vue") },
  { path: "/day/:day/:month/:year", name: "DayView", component: DayView, props: true, meta: { requiresAuth: true } },

  {
    path: "/dayframer",
    name: "Dayframer",
    component: DayFramer,
    props: (route) => ({
      initialDate: typeof route.query.date === "string" ? route.query.date : undefined,
    }),
    meta: { requiresAuth: true },
  },

  { path: "/monthly", name: "Monthly", component: MonthlyView, meta: { requiresAuth: true } },
  { path: "/dashboard", name: "DashBoard", component: DashBoard, meta: { requiresAuth: true } },
  { path: "/onboarding", name: "Onboarding", component: OnBoardingPage, meta: { requiresAuth: true } },
  { path: "/settings", name: "Settings", component: SettingsPage, meta: { requiresAuth: true } },
  { path: "/planpage", name: "PlanPage", component: PlanPage, meta: { requiresAuth: true } },

  // Team Management
  { path: "/team/manage", name: "TeamManagement", component: TeamManagementPage, meta: { requiresAuth: true } },

  // WIP + 404
  { path: "/wip", name: "WIP", component: WIPPage },
  { path: "/404", name: "NotFoundExplicit", component: NotFound },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// Only check session for routes that require auth
router.beforeEach(async (to) => {
  const needsAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (!needsAuth) return true;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { name: "Welcome", query: { mode: "signin", redirect: to.fullPath } };
    }
  } catch {
    return { name: "Welcome", query: { mode: "signin", redirect: to.fullPath } };
  }
  return true;
});

export default router;
