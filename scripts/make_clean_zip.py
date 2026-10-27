import os
import zipfile

output_path = 'public/arzon-tj-latest.zip'
if os.path.exists(output_path):
    os.remove(output_path)

exclude_prefixes = (
    'node_modules',
    '.git',
    '.aistudio',
    'dist',
    os.path.join('android', '.gradle'),
    os.path.join('android', 'app', 'build'),
    os.path.join('public', 'arzon-tj-latest.zip'),
)

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
    for root, dirs, files in os.walk('.'):
        rel_dir = os.path.relpath(root, '.')
        if rel_dir == '.':
            rel_dir = ''
        
        # Prune dirs in place
        dirs[:] = [d for d in dirs if not any(os.path.join(rel_dir, d).startswith(p) for p in exclude_prefixes)]

        for file in files:
            rel_file = os.path.normpath(os.path.join(rel_dir, file))
            if any(rel_file.startswith(p) for p in exclude_prefixes):
                continue
            zipf.write(rel_file, rel_file)

size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"Created clean zip archive: {size_mb:.2f} MB")
