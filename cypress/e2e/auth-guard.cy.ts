describe('Admin Route Protection - Direct Tests', () => {
  // Test admin routes directly without custom commands
  const adminRoutes = [
    '/admin',
    '/admin/advertisements',
    '/admin/advertisements/create',
    '/admin/advertisements/edit/1',
    '/admin/countries',
    '/admin/courses',
    '/admin/feature-flags',
    '/admin/feature-flags/create',
    '/admin/feature-flags/edit/1',
    '/admin/question-plans',
    '/admin/question-plans/edit/1',
    '/admin/question-plans/create',
    '/admin/roadmaps',
    '/admin/schools',
    '/admin/settings',
    '/admin/sponsors',
    '/admin/sponsors/create',
    '/admin/sponsors/edit/1',
    '/admin/topics',
  ];

  beforeEach(() => {
    // Clear all storage before each test
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
    cy.clearCookies();
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to login when visiting admin dashboard without auth', () => {
      cy.visit('/admin');
      
      // Should be redirected to login page
      cy.url().should('include', '/login');
      
      // Should see login form
      cy.get('form').should('exist');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.contains('Login').should('be.visible');
    });

    it('should redirect all admin routes to login', () => {
      adminRoutes.forEach((route) => {
        cy.visit(route);
        cy.url().should('include', '/login');
        
        // Clear storage for next test
        cy.window().then((win) => {
          win.localStorage.clear();
          win.sessionStorage.clear();
        });
      });
    });

    it('should show loading spinner before redirect', () => {
      cy.visit('/admin');
      
      // Should show loading state
      cy.get('.animate-spin, [class*="spinner"], [class*="loader"]', { timeout: 5000 })
        .should('exist')
        .and('be.visible');
    });
  });

  describe('Authenticated Access', () => {
    it('should allow access when token is set in localStorage', () => {
      // Set a token directly in localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('lms_auth_token', 'test-token-123');
      });

      cy.visit('/admin');
      
      // Should NOT redirect to login
      cy.url().should('not.include', '/login');
      
      // Should show admin content
      cy.get('main').should('exist');
      cy.get('nav').should('exist');
      
      // Should NOT show login form
      cy.get('input[type="email"]').should('not.exist');
      cy.get('input[type="password"]').should('not.exist');
    });

    it('should access all admin routes with token', () => {
      // Set token
      cy.window().then((win) => {
        win.localStorage.setItem('lms_auth_token', 'test-token-123');
      });

      adminRoutes.forEach((route) => {
        cy.visit(route);
        
        // Should be on the admin route (not redirected)
        cy.url().should('include', route);
        
        // Should show admin layout
        cy.get('main').should('exist');
      });
    });
  });

  describe('Token Validation', () => {
    it('should handle empty token string', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('lms_auth_token', '');
      });

      cy.visit('/admin');
      cy.url().should('include', '/login');
    });

    it('should handle null/undefined token', () => {
      cy.window().then((win) => {
        win.localStorage.removeItem('lms_auth_token');
      });

      cy.visit('/admin');
      cy.url().should('include', '/login');
    });
  });
});