import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HaAksesComponent } from './ha-akses/ha-akses.component';
import { HaUsersComponent } from './ha-users/ha-users.component';


const routes: Routes = [
  {
    path: 'akses',
    component: HaAksesComponent
  },
  {
    path: 'users',
    component: HaUsersComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HakAksesRoutingModule { }
