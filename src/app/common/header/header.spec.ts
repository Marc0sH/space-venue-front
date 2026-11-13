import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    localStorage.removeItem('space-venue-theme');
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('space-venue-theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle and persist the color theme', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.themeToggle');
    expect(button.getAttribute('aria-label')).toBe('Cambiar a modo oscuro');

    button.click();
    fixture.detectChanges();

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('space-venue-theme')).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Cambiar a modo luminoso');

    button.click();
    fixture.detectChanges();

    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('space-venue-theme')).toBe('light');
  });

  it('should show a button that scrolls to the top after scrolling down', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 250 });
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.scrollTopBtn');
    expect(button).toBeTruthy();

    button.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
