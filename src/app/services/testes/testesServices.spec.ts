import { TestBed } from '@angular/core/testing';

import { TestesService } from './testesService';

describe('TestesService', () => {
  let service: TestesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TestesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
