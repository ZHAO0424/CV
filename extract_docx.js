const fs = require('fs');
try {
    const xml = fs.readFileSync('C:\\Users\\zzrsn\\Desktop\\CV\\temp_docx\\word\\document.xml', 'utf8');
    // <w:p> is paragraph, <w:r> is run, <w:t> is text.
    // Replace <w:p> with newline to preserve structure
    let text = xml.replace(/<w:p[^>]*>/g, '\n');
    // Remove all other tags
    text = text.replace(/<[^>]+>/g, '');
    fs.writeFileSync('C:\\Users\\zzrsn\\Desktop\\CV\\parsed_cv.txt', text);
    console.log("Extracted CV to parsed_cv.txt");
} catch(e) {
    console.log(e);
}
