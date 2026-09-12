import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("../components/layout/AppLayout.vue"),
    children: [
      { path: "",                name: "Dashboard",    component: () => import("../views/Dashboard.vue") },
      { path: "tenders",         name: "TenderList",   component: () => import("../views/TenderList.vue") },
      { path: "tenders/:id",     name: "TenderDetail", component: () => import("../views/TenderDetail.vue"), props: true },
      { path: "bookmarks",       name: "Bookmarks",    component: () => import("../views/Bookmarks.vue") },
      { path: "logs",            name: "Logs",         component: () => import("../views/Logs.vue") },
      { path: "portals",         name: "Portals",      component: () => import("../views/Portals.vue") },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: "smooth" };
  },
});

export default router;
