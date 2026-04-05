import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnidadeSaudeModalComponent } from './unidade-saude-modal';

describe('UnidadeSaudeModal', () => {
  let component: UnidadeSaudeModalComponent;
  let fixture: ComponentFixture<UnidadeSaudeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadeSaudeModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnidadeSaudeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
