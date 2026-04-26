import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import OrdersView from "../views/OrdersView.vue";
import OrderDetailView from "../views/OrderDetailView.vue";
import ProductsView from "../views/ProductsView.vue";
import ProductAddView from "../views/ProductAddView.vue";
import UserAddView from "../views/UserAddView.vue";
import UsersView from "../views/UsersView.vue";
import SitesView from "../views/SitesView.vue";
import SiteAddView from "../views/SiteAddView.vue";
import ReportsView from "../views/ReportsView.vue";
import DailyReportView from "../views/DailyReportView.vue";
import LeafPagesView from "../views/LeafPagesView.vue";
import LeafPageAddView from "../views/LeafPageAddView.vue";
import LeafPageReportView from "../views/LeafPageReportView.vue";
import CreateOrderView from "../views/CreateOrderView.vue";
import SecurityView from "../views/SecurityView.vue";
import SettingsView from "../views/SettingsView.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { requiresGuest: true },
  },
  {
    path: "/",
    name: "Dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders",
    name: "Orders",
    component: OrdersView,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders/:id",
    name: "OrderDetail",
    component: OrderDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders/create",
    name: "CreateOrder",
    component: CreateOrderView,
    meta: { requiresAuth: true },
  },
  {
    path: "/products",
    name: "Products",
    component: ProductsView,
    meta: { requiresAuth: true },
  },
  {
    path: "/products/add",
    name: "ProductAdd",
    component: ProductAddView,
    meta: { requiresAuth: true },
  },
  {
    path: "/products/:id/edit",
    name: "ProductEdit",
    component: ProductAddView,
    meta: { requiresAuth: true },
  },
  {
    path: "/users",
    name: "Users",
    component: UsersView,
    meta: { requiresAuth: true },
  },
  {
    path: "/users/add",
    name: "UserAdd",
    component: UserAddView,
    meta: { requiresAuth: true },
  },
  {
    path: "/users/:id/edit",
    name: "UserEdit",
    component: UserAddView,
    meta: { requiresAuth: true },
  },
  {
    path: "/sites",
    name: "Sites",
    component: SitesView,
    meta: { requiresAuth: true },
  },
  {
    path: "/sites/add",
    name: "SiteAdd",
    component: SiteAddView,
    meta: { requiresAuth: true },
  },
  {
    path: "/sites/:id/edit",
    name: "SiteEdit",
    component: SiteAddView,
    meta: { requiresAuth: true },
  },
  {
    path: "/reports",
    name: "Reports",
    component: ReportsView,
    meta: { requiresAuth: true },
  },
  {
    path: "/daily-report",
    name: "DailyReport",
    component: DailyReportView,
    meta: { requiresAuth: true },
  },
  {
    path: "/leaf-pages",
    name: "LeafPages",
    component: LeafPagesView,
    meta: { requiresAuth: true },
  },
  {
    path: "/leaf-pages/add",
    name: "LeafPageAdd",
    component: LeafPageAddView,
    meta: { requiresAuth: true },
  },
  {
    path: "/leaf-pages/:id/edit",
    name: "LeafPageEdit",
    component: LeafPageAddView,
    meta: { requiresAuth: true },
  },
  {
    path: "/leaf-pages/:slug/reports",
    name: "LeafPageReport",
    component: LeafPageReportView,
    meta: { requiresAuth: true },
  },
  {
    path: "/security",
    name: "Security",
    component: SecurityView,
    meta: { requiresAuth: true },
  },
  {
    path: "/settings",
    name: "Settings",
    component: SettingsView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("admin_token");

  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
