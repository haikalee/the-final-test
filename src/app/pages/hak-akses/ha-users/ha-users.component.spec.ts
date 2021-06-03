import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HaUsersComponent } from './ha-users.component';

describe('HaUsersComponent', () => {
  let component: HaUsersComponent;
  let fixture: ComponentFixture<HaUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HaUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HaUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
