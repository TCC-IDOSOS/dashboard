import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnidadeSaude } from './unidade-saude';

describe('UnidadeSaude', () => {
  let component: UnidadeSaude;
  let fixture: ComponentFixture<UnidadeSaude>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadeSaude]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnidadeSaude);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
