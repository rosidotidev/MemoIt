import { Routes } from '@angular/router';
import { loginGuard, sessionGuard } from './core/state/session.guard';
import { categoryGuard } from './features/items/category.guard';
import { CategorySettingsComponent } from './features/category-settings/category-settings.component';
import { ItemEditComponent } from './features/item-edit/item-edit.component';
import { itemGuard } from './features/item-edit/item.guard';
import { ItemNewComponent } from './features/item-edit/item-new.component';
import { ItemsComponent } from './features/items/items.component';
import { LoginComponent } from './features/auth/login.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { SettingsComponent } from './features/settings/settings.component';
import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  {
    path: '',
    component: ShellComponent,
    canActivate: [sessionGuard],
    children: [
      { path: 'categories', component: CategoriesComponent },
      { path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] },
      {
        path: 'c/:categoryId/settings',
        component: CategorySettingsComponent,
        canActivate: [categoryGuard],
      },
      { path: 'c/:categoryId/i/new', component: ItemNewComponent, canActivate: [categoryGuard] },
      {
        path: 'c/:categoryId/i/:itemId',
        component: ItemEditComponent,
        canActivate: [categoryGuard, itemGuard],
      },
      {
        path: 'report',
        loadComponent: () => import('./features/report/report.component').then((m) => m.ReportComponent),
        providers: [provideCharts(withDefaultRegisterables())],
      },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
      { path: '**', redirectTo: 'categories' },
    ],
  },
];
