# Implementation Plan

- [x] 1. Set up cleanup infrastructure







  - Create archive directory structure (docs/archived with subdirectories)
  - Create TypeScript utility for file operations
  - Set up manifest generation system
  - _Requirements: 2.1, 2.2, 2.5_


- [-] 2. Implement file analysis system




  - [ ] 2.1 Create import graph builder
    - Write function to parse TypeScript/JavaScript imports
    - Build graph starting from main.tsx and App.tsx entry points
    - Handle both static and dynamic imports
    - _Requirements: 1.2_



  - [ ] 2.2 Implement unused file detector




    - Traverse import graph to find reachable files
    - Identify files not in reachable set
    - Exclude configuration and build files from analysis
    - _Requirements: 1.1, 1.3_




  - [x] 2.3 Create file categorizer



    - Categorize files by type (pages, scripts, SQL, HTML, markdown)
    - Generate categorized report
    - _Requirements: 1.4_






  - [ ] 2.4 Generate analysis report


    - Create human-readable report of unused files





    - Include file sizes and last modified dates



    - Present findings to user for review
    - _Requirements: 1.5_

- [x] 3. Archive unused pages and components


  - [x] 3.1 Archive unused page components



    - Move Index.tsx, About.tsx, Events.tsx, Sermons.tsx to docs/archived/pages/
    - Move Contact.tsx, Partnership.tsx, Terms.tsx, EventDetail.tsx
    - Verify file content preservation
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Archive unused UI components





    - Move Header.tsx, Hero.tsx, Footer.tsx to docs/archived/components/
    - Move EventCard.tsx, SermonCard.tsx
    - Update manifest with archived components
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 4. Archive diagnostic scripts



  - [ ] 4.1 Move root-level JavaScript scripts
    - Archive all diagnostic .js files from root to docs/archived/scripts/
    - Include add_multiple_superadmins.js, check_users.js, diagnose.js, etc.
    - _Requirements: 2.4_

  - [x] 4.2 Archive batch files




    - Move all .bat files to docs/archived/scripts/
    - Document their original purpose in manifest
    - _Requirements: 2.4_


- [x] 5. Archive SQL migration files







  - [x] 5.1 Archive root SQL files






    - Move all .sql files from root to docs/archived/sql/
    - Preserve file naming for reference
    - _Requirements: 2.3_

  - [x] 5.2 Archive Supabase SQL migrations






    - Move SQL files from src/integrations/supabase/ to docs/archived/sql/migrations/
    - Keep organized by original subdirectory
    - _Requirements: 2.3_


  - [x] 5.3 Archive supabase directory SQL files




    - Move SQL files from supabase/ directory to docs/archived/sql/supabase/
    - Maintain structure for reference
    - _Requirements: 2.3_

- [x] 6. Archive test and debug files








  - [x] 6.1 Archive HTML test files




    - Move all .html test files to docs/archived/html-tests/

    - Include debug-login.html, test-frontend-signin.html, etc.
    - _Requirements: 2.1_

  - [x] 6.2 Archive backup and temp files





    - Move current-db-backup.json to docs/archived/backups/
    - Archive .bak files and fix.js files
    - _Requirements: 2.1_


- [x] 7. Consolidate and organize documentation





  - [x] 7.1 Archive scattered markdown files






    - Move implementation guides to docs/archived/markdown-docs/
    - Move fix guides and setup instructions
    - _Requirements: 4.1, 4.2_



  - [x] 7.2 Organize active documentation





    - Create docs/database/ for database schema docs
    - Create docs/authentication/ for auth docs
    - Create docs/features/ for feature documentation
    - _Requirements: 6.1, 6.2_



  - [x] 7.3 Create documentation index





    - Write docs/README.md with overview of all documentation
    - Link to archived files manifest
    - Provide navigation to active docs
    - _Requirements: 6.3_


- [x] 8. Generate archive manifest



  - Create comprehensive manifest.json in docs/archived/
  - Include original paths, archive paths, timestamps
  - Add summary statistics (total files, sizes, categories)
  - _Requirements: 2.5_

- [-] 9. Checkpoint - Verify archival before deletion


  - Ensure all tests pass, ask the user if questions arise.
  - Review manifest with user
  - Confirm all files archived correctly
  - Get explicit approval before proceeding to deletion

- [ ] 10. Remove archived files from original locations

  - [ ] 10.1 Delete archived pages and components

    - Remove unused page files from src/pages/
    - Remove unused component files from src/components/
    - _Requirements: 3.5_

  - [ ] 10.2 Delete archived scripts and SQL files

    - Remove diagnostic scripts from root
    - Remove SQL files from root and subdirectories
    - Remove batch files
    - _Requirements: 3.5_

  - [ ] 10.3 Delete test files and backups

    - Remove HTML test files
    - Remove backup and temp files
    - Remove archived markdown files
    - _Requirements: 3.5_

- [ ] 11. Clean up unused imports and dead code

  - [ ] 11.1 Scan for unused imports in active files

    - Analyze all remaining TypeScript files
    - Identify imports that reference archived files
    - _Requirements: 3.1_

  - [ ] 11.2 Remove unused imports

    - Remove imports of archived components
    - Update import statements
    - _Requirements: 3.5_

  - [ ] 11.3 Identify and remove dead code

    - Find exported functions never imported
    - Remove unused utility functions
    - Clean up commented-out code
    - _Requirements: 3.3, 3.4_

- [ ] 12. Run comprehensive verification

  - [ ] 12.1 TypeScript compilation check

    - Run tsc --noEmit to check for type errors
    - Verify no import resolution errors
    - _Requirements: 5.1, 5.3_

  - [ ] 12.2 Verify route accessibility

    - Check all routes defined in App.tsx
    - Ensure route components exist and load
    - _Requirements: 5.2_

  - [ ] 12.3 Validate import resolution

    - Verify all imports resolve correctly
    - Check for missing dependencies
    - _Requirements: 5.3_

  - [ ] 12.4 Generate verification report

    - Create detailed report of verification results
    - Include any warnings or errors found
    - Provide cleanup summary statistics
    - _Requirements: 5.4, 5.5_

- [ ] 13. Final checkpoint - Manual testing

  - Ensure all tests pass, ask the user if questions arise.
  - User should test admin dashboard functionality
  - Verify authentication works
  - Check member, pastor, event, and user management
  - Confirm all church units routes work
