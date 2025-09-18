// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import HomePage from "@/components/HomePage/HomePage.vue";
import DayFramer from "@/components/DayFramer/DayFramer.vue";
import DayView from "@/components/DayFramer/DayView.vue";
import DashBoard from "@/components/DashBoard.vue";
import MonthlyView from "@/components/Monthly/MonthlyView.vue";
import TeamManagementPage from "@/components/Monthly/TeamManagementPage.vue"; // ✅ in Monthly
import OnBoardingPage from "@/components/Onboarding/OnBoardingPage.vue";
import WelcomePage from "@/components/AuthPage/WelcomePage.vue";
import WIPPage from "@/components/WorkInProgress/WorkInProgress.vue";
import NotFound from "@/components/WorkInProgress/NotFound.vue";
import SettingsPage from "@/components/SettingsPage/SettingsPage.vue";

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
  { path: "/home", name: "Homepage", component: HomePage },
  { path: "/about", name: "About", component: () => import("@/views/AboutView.vue") },
  { path: "/day/:day/:month/:year", name: "DayView", component: DayView, props: true },

  {
    path: "/dayframer",
    name: "Dayframer",
    component: DayFramer,
    props: (route) => ({
      initialDate: typeof route.query.date === "string" ? route.query.date : undefined,
    }),
  },

  { path: "/monthly", name: "Monthly", component: MonthlyView },
  { path: "/dashboard", name: "DashBoard", component: DashBoard },
  { path: "/onboarding", name: "Onboarding", component: OnBoardingPage },
  { path: "/settings", name: "Settings", component: SettingsPage },

  // Team Management (now under Monthly)
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

export default router;
