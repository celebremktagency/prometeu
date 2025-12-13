#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Properties to remove
const textProperties = [
  'fontSize',
  'fontWeight', 
  'fontFamily',
  'color',
  'backgroundColor',
  'textColor'
];

// Function to clean a file
function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Remove text properties from style objects
  textProperties.forEach(prop => {
    const regex = new RegExp(`\\s*${prop}:\\s*[^,}]*[,}]?`, 'g');
    const beforeReplace = content;
    content = content.replace(regex, '');
    if (beforeReplace !== content) {
      changed = true;
    }
  });

  // Clean up empty style objects
  content = content.replace(/{\s*}/g, '{}');
  
  // Clean up trailing commas in objects
  content = content.replace(/,(\s*})/g, '$1');
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

// Recursively find and clean files
function cleanDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      cleanDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        cleanFile(fullPath);
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
  });
}

console.log('Cleaning all text styling properties...');
cleanDirectory('./app/src');
console.log('Done!');