import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'workspaces',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@jira-prt/features/auth').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@jira-prt/features/auth').then((m) => m.RegisterComponent),
  },
  {
    path: 'workspaces',
    loadComponent: () =>
      import('@jira-prt/features/workspaces').then(
        (m) => m.WorkspacesComponent,
      ),
  },
  {
    path: 'project/:projectId',
    loadComponent: () =>
      import('@jira-prt/shared/ui').then((m) => m.LayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'board',
      },
      {
        path: 'board',
        loadComponent: () =>
          import('@jira-prt/features/board').then((m) => m.BoardComponent),
      },
      {
        path: 'backlog',
        loadComponent: () =>
          import('@jira-prt/features/backlog').then((m) => m.BacklogComponent),
      },
      {
        path: 'issues',
        loadComponent: () =>
          import('@jira-prt/features/issues-list').then(
            (m) => m.IssuesListComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('@jira-prt/features/reports').then((m) => m.ReportsComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('@jira-prt/features/settings').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'workspaces',
  },
];
