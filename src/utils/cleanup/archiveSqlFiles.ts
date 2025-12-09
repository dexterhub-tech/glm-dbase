import * as fs from 'fs/promises';
import * as path from 'path';
import { FileArchiver } from './fileArchiver';
import type { UnusedFile } from './unusedFileDetector';

interface SqlFileInfo {
  filename: string;
  purpose: string;
}

/**
 * Archive SQL files from root, src/integrations/supabase/, and supabase/ directories
 */
export async function archiveSqlFiles(): Promise<void> {
  const archiver = new FileArchiver('docs/archived');
  
  // Ensure archive structure exists
  await archiver.createArchiveStructure();

  // Load existing manifest
  const existingManifest = await archiver.loadManifest();
  const existingFiles = existingManifest?.files || [];

  console.log('📦 Archiving SQL migration files...\n');

  // Track all results
  const allResults: any[] = [];

  // ===== SUBTASK 5.1: Archive root SQL files =====
  console.log('📁 Step 1: Archiving root SQL files...');
  const rootSqlFiles: SqlFileInfo[] = [
    {
      filename: 'DIRECT_SQL_FIX.sql',
      purpose: 'Direct SQL fix for database issues'
    },
    {
      filename: 'emergency_fix_simple.sql',
      purpose: 'Emergency simple fix for critical database issues'
    },
    {
      filename: 'fix_phone_constraint.sql',
      purpose: 'Fix phone number constraint for Nigerian phone numbers'
    },
    {
      filename: 'fix_superuser_access.sql',
      purpose: 'Fix superuser access permissions'
    },
    {
      filename: 'fix_user_operations.sql',
      purpose: 'Fix user operations and permissions'
    },
    {
      filename: 'simple_phone_fix.sql',
      purpose: 'Simple phone validation fix'
    }
  ];

  const rootFilesToArchive: UnusedFile[] = [];
  
  for (const sqlFile of rootSqlFiles) {
    try {
      const stats = await fs.stat(sqlFile.filename);
      rootFilesToArchive.push({
        path: sqlFile.filename,
        type: 'sql',
        size: stats.size,
        lastModified: stats.mtime,
        purpose: sqlFile.purpose
      });
    } catch (error) {
      console.log(`  ⚠️  ${sqlFile.filename} not found, skipping...`);
    }
  }

  if (rootFilesToArchive.length > 0) {
    const rootResults = await archiver.archiveFiles(
      rootFilesToArchive.map(file => ({ file, category: 'sql' }))
    );
    
    for (const result of rootResults) {
      if (result.success) {
        console.log(`  ✅ ${result.originalPath} → ${result.archivePath}`);
      } else {
        console.log(`  ❌ ${result.originalPath} - Error: ${result.error}`);
      }
    }
    
    allResults.push(...rootResults.map((result, index) => ({
      ...result,
      purpose: rootFilesToArchive[index].purpose
    })));
  } else {
    console.log('  ℹ️  No root SQL files found to archive.');
  }

  // ===== SUBTASK 5.2: Archive Supabase SQL migrations =====
  console.log('\n📁 Step 2: Archiving Supabase SQL migrations...');
  const supabaseIntegrationsPath = 'src/integrations/supabase';
  
  try {
    const supabaseFiles = await fs.readdir(supabaseIntegrationsPath);
    const supabaseSqlFiles = supabaseFiles.filter(file => file.endsWith('.sql'));
    
    const supabaseFilesToArchive: UnusedFile[] = [];
    
    for (const sqlFile of supabaseSqlFiles) {
      const fullPath = path.join(supabaseIntegrationsPath, sqlFile);
      try {
        const stats = await fs.stat(fullPath);
        supabaseFilesToArchive.push({
          path: fullPath,
          type: 'sql',
          size: stats.size,
          lastModified: stats.mtime,
          purpose: `Supabase migration: ${sqlFile}`
        });
      } catch (error) {
        console.log(`  ⚠️  ${fullPath} not found, skipping...`);
      }
    }

    if (supabaseFilesToArchive.length > 0) {
      const supabaseResults = await archiver.archiveFiles(
        supabaseFilesToArchive.map(file => ({ file, category: 'sql/migrations' }))
      );
      
      for (const result of supabaseResults) {
        if (result.success) {
          console.log(`  ✅ ${result.originalPath} → ${result.archivePath}`);
        } else {
          console.log(`  ❌ ${result.originalPath} - Error: ${result.error}`);
        }
      }
      
      allResults.push(...supabaseResults.map((result, index) => ({
        ...result,
        purpose: supabaseFilesToArchive[index].purpose
      })));
    } else {
      console.log('  ℹ️  No Supabase SQL migration files found to archive.');
    }
  } catch (error) {
    console.log(`  ⚠️  Could not read ${supabaseIntegrationsPath} directory`);
  }

  // ===== SUBTASK 5.3: Archive supabase directory SQL files =====
  console.log('\n📁 Step 3: Archiving supabase/ directory SQL files...');
  const supabaseDirPath = 'supabase';
  
  try {
    const supabaseDirFiles = await fs.readdir(supabaseDirPath);
    const supabaseDirSqlFiles = supabaseDirFiles.filter(file => file.endsWith('.sql'));
    
    const supabaseDirFilesToArchive: UnusedFile[] = [];
    
    for (const sqlFile of supabaseDirSqlFiles) {
      const fullPath = path.join(supabaseDirPath, sqlFile);
      try {
        const stats = await fs.stat(fullPath);
        supabaseDirFilesToArchive.push({
          path: fullPath,
          type: 'sql',
          size: stats.size,
          lastModified: stats.mtime,
          purpose: `Supabase setup: ${sqlFile}`
        });
      } catch (error) {
        console.log(`  ⚠️  ${fullPath} not found, skipping...`);
      }
    }

    if (supabaseDirFilesToArchive.length > 0) {
      const supabaseDirResults = await archiver.archiveFiles(
        supabaseDirFilesToArchive.map(file => ({ file, category: 'sql/supabase' }))
      );
      
      for (const result of supabaseDirResults) {
        if (result.success) {
          console.log(`  ✅ ${result.originalPath} → ${result.archivePath}`);
        } else {
          console.log(`  ❌ ${result.originalPath} - Error: ${result.error}`);
        }
      }
      
      allResults.push(...supabaseDirResults.map((result, index) => ({
        ...result,
        purpose: supabaseDirFilesToArchive[index].purpose
      })));
    } else {
      console.log('  ℹ️  No supabase/ directory SQL files found to archive.');
    }
  } catch (error) {
    console.log(`  ⚠️  Could not read ${supabaseDirPath} directory`);
  }

  // Update manifest
  if (allResults.length > 0) {
    const updatedFiles = [...existingFiles, ...allResults];
    const manifest = await archiver.generateManifest(updatedFiles);
    await archiver.saveManifest(manifest);

    console.log('\n✅ Manifest updated successfully!');
    console.log(`📄 Total archived files: ${manifest.summary.totalFiles}`);
    console.log(`📁 By category:`, manifest.summary.byCategory);
  } else {
    console.log('\nℹ️  No SQL files were archived.');
  }
}

// Export for use in other scripts
export default archiveSqlFiles;
