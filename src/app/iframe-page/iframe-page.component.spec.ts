import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IframePageComponent } from './iframe-page.component';

describe('IframePageComponent', () => {
  let component: IframePageComponent;
  let fixture: ComponentFixture<IframePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IframePageComponent]
    });
    fixture = TestBed.createComponent(IframePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
