import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HaAksesComponent } from './ha-akses.component';

describe('HaAksesComponent', () => {
  let component: HaAksesComponent;
  let fixture: ComponentFixture<HaAksesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HaAksesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HaAksesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
