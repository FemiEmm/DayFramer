// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomePage from "@/components/HomePage/HomePage.vue";
import DayFramer from "@/components/DayFramer/DayFramer.vue";
import DayView from "@/components/DayFramer/DayView.vue";
import LocalStorageManager from "@/LocalStorageManager.vue";
import DashBoard from "@/components/DashBoard.vue";
import MonthlyView from "@/components/Monthly/MonthlyView.vue";
import OnBoardingPage from "@/components/Onboarding/OnBoardingPage.vue";

// Welcome page (first page)
import WelcomePage from "@/components/AuthPage/WelcomePage.vue";

// WIP + 404 pages
import WIPPage from "@/components/WorkInProgress/WorkInProgress.vue";
import NotFound from "@/components/WorkInProgress/NotFound.vue";

// src/router/index.ts
import SettingsPage from "@/components/SettingsPage/SettingsPage.vue";


const routes: Array<RouteRecordRaw> = [
  // FIRST PAGE: WelcomePage
  { path: "/", name: "Welcome", component: WelcomePage },

  // Auth email flows
  {
    path: "/auth/callback",
    name: "AuthCallback",
    component: () => import("@/components/AuthPage/AuthCallback.vue"),
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("@/components/AuthPage/ForgotPassword.vue"),
  },

  // Aliases to open specific tabs on Welcome
  {
    path: "/signin",
    name: "SignIn",
    redirect: (to) => ({ path: "/", query: { ...to.query, mode: "signin" } }),
  },
  {
    path: "/signup",
    name: "SignUp",
    redirect: (to) => ({ path: "/", query: { ...to.query, mode: "signup" } }),
  },
  {
    path: "/welcome",
    name: "WelcomeAlias",
    redirect: (to) => ({ path: "/", query: to.query }),
  },

  // Home kept at /home
  { path: "/home", name: "Homepage", component: HomePage },

  { path: "/about", name: "about", component: () => import("../views/AboutView.vue") },
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
  { path: "/manager", name: "Manager", component: LocalStorageManager, props: true },
  { path: "/dashboard", name: "DashBoard", component: DashBoard },
  { path: "/onboarding", name: "Onboarding", component: OnBoardingPage },
  { path: "/settings", name: "Settings", component: SettingsPage },

  // WIP + 404
  { path: "/wip", name: "WIP", component: WIPPage },
  { path: "/404", name: "NotFoundExplicit", component: NotFound },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
