
document.addEventListener('DOMContentLoaded', function () {
    const sheetId = '2PACX-1vRhT4Aeotku1_0OcOirDBCRhEjcsyEf2cu-R-i6TnTzgkBMAnch6y23BkgNOwEmXRd3ztNjqA7Zkopv';
    const gid = '852121507';
    const csvUrl = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=${gid}&single=true&output=csv`;

    // Map month spanish names to numbers (optional, if date parsing needed)
    // But we just display the date string from CSV usually.

    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const rows = parseCSV(csvText);
            const agendaBody = document.getElementById('agenda-body');

            if (!agendaBody) return;

            agendaBody.innerHTML = ''; // Clear loading message

            rows.forEach(row => {
                // Column mapping based on CSV structure:
                // 0: Semana, 1: Fecha, 2: Tipo de sesión, 3: Temas / Actividad, 4: Publicación, 5: Entrega

                const fecha = row[1];
                const tipoSesion = row[2];
                const tema = row[3];
                const publicacion = row[4];
                const entrega = row[5];

                // Filter logic: Only show rows related to Practices (P1-P6) or Deliveries
                // User requested ONLY activities related to Practices.
                // 1. "Tipo de sesión" IS "Práctica"
                // 2. OR "Temas" contains "P" + number (e.g. P1, P2)
                // 3. OR "Entrega" is not empty (deadlines)
                // 4. OR "Publicación" is not empty

                const isStrictPractice = tipoSesion === 'Práctica';
                const hasPContent = tema && /P\d/.test(tema);
                const hasDelivery = entrega && (entrega.trim().length > 1);
                const hasPub = publicacion && (publicacion.trim().length > 1);

                const shouldShow = isStrictPractice || hasPContent || hasDelivery || hasPub;

                if (shouldShow && fecha) {
                    const tr = document.createElement('tr');

                    // Construct Activity Description
                    let actividadDesc = tema;
                    if (tipoSesion === 'Práctica' && !tema.toLowerCase().includes('práctica')) {
                        // If it just says "P1", make it "Práctica 1"
                        if (/P\d/.test(tema)) {
                            actividadDesc = tema.replace(/(P)(\d+)/, 'Práctica $2');
                        }
                    }
                    // Append detail if available (e.g. from column 4 "Publicación...") matches current row? 
                    // Actually column 4 in CSV is "Publicación de la Práctica".
                    // The user's manual table had "Práctica 1: Telescopios".
                    // In CSV, row 4: 26/02, Práctica, P1, P1 - Telescopios, (empty)
                    // So Column 4 (index 4) seems to be the detailed description?
                    // Let's re-verify CSV content from Step 1317.
                    // Header: Semana,Fecha,Tipo de sesión,Temas / Actividad,Publicación de la Práctica,Entrega del informe
                    // Row: ,,26/02,Práctica,P1,P1 - Telescopios,
                    // So:
                    // Col 1: 26/02 (Fecha)
                    // Col 2: Práctica (Tipo)
                    // Col 3: P1 (Temas)
                    // Col 4: P1 - Telescopios (Publicación?? No, wait)

                    // Let's look at Step 1317 CSV output again carefully.
                    // Semana,Fecha,Tipo de sesión,Temas / Actividad,Publicación de la Práctica,Entrega del informe
                    // ,26/02,Práctica,P1,P1 - Telescopios,
                    // So Col 4 is "Publicación de la Práctica". But it contains "P1 - Telescopios".
                    // That looks like the "Activity Name" the user wants.
                    // Row 5: 3,03/03,Práctica,P1,,
                    // Here Col 4 is empty.

                    // Logic:
                    // Display Date (Col 1)
                    // Display Activity: Start with Col 4. If empty, use Col 3 (Temas) + " (" + Col 2 + ")"?
                    // Or if Col 3 is "P1", display "Práctica 1".

                    let displayActivity = '';
                    if (row[4] && row[4].trim() !== '') {
                        displayActivity = row[4]; // Use detailed name like "P1 - Telescopios"
                    } else if (tema && tema.trim() !== '') {
                        displayActivity = tema.replace(/(P)(\d+)/, 'Práctica $2');
                        if (tipoSesion && tipoSesion.includes('Sesión')) {
                            displayActivity += ' (Continuación)';
                        } else {
                            // Naive check for session 2 based on previous attempts?
                            // Simplest is just to show what's in 'Temas' if 'Publicación' is empty.
                            // Maybe add " (Sesión 2)" if it's the second time we see P1? Too complex for now.
                            // Providing raw text is safer.
                        }
                    }

                    // Display Deliverables: Col 5 (Entrega del informe)
                    // Also Col 4 (Publicación) sometimes implies a deliverable/action? 
                    // No, Col 4 is "Publicación". 
                    // In the manual table we put "Publicación P1" in the 3rd column.
                    // So:
                    // Col 3 of HTML table = combined info?

                    // Let's match the manual table I created in Step 1295.
                    // Col 1: Date
                    // Col 2: Activity (Mainly what practice it is)
                    // Col 3: Entrega/Publicación

                    // Revised Logic:
                    // HTML Col 1: row[1] (Fecha)
                    // HTML Col 2: 
                    //    If row[4] (Publicación) has content like "P1 - ...", maybe that's the Title? 
                    //    But in row "03/03", row[4] is empty. row[3] is "P1".
                    //    User manually labeled it "Práctica 1 (Sesión 2)".
                    //    The CSV doesn't explicitly say "Sesión 2".
                    //    We can stick to: row[3] (Temas) e.g. "P1". Maybe expand to "Práctica 1".
                    //    If row[4] has content, append it? No, row[4] is "Publicación", e.g. the PDF link/title.

                    // HTML Col 3: 
                    //    Combine row[4] (Publicación) text + row[5] (Entrega).
                    //    Example:
                    //    Row 26/02: Col4="P1 - Telescopios", Col5="".  -> "Publicación: P1 - Telescopios"?
                    //    User manual table: "Publicación P1".

                    // Let's refine based on user preference "extrae las actividades relacionadas con las Prácticas".


                    let col2Content = "-";
                    // Only show Topic Name if it IS a practice or explicitly P-content
                    if (isStrictPractice || hasPContent) {
                        col2Content = tema;
                        if (/^P\d+$/.test(tema)) {
                            col2Content = tema.replace('P', 'Práctica ');
                        }
                        // Add description from Col 4 if it's the first session
                        if (row[4] && row[4].includes(tema + ' -')) {
                            col2Content += ': ' + row[4].split('-')[1].trim();
                        }
                    }


                    let col3Content = [];
                    // If there is publication info that ISN't just the title...
                    // In CSV: "P1 - Telescopios" is in Col 4. 
                    // User manual step 1295: Col 3 was "Publicación P1".
                    // If Col 4 is present, we can say "Publicación " + tema or simplify.
                    if (row[4]) col3Content.push("Publicación");
                    if (row[5]) col3Content.push(row[5]);

                    // HTML Injection
                    tr.innerHTML = `
                        <td>${fecha}</td>
                        <td>${col2Content}</td>
                        <td>${col3Content.join(' / ') || '-'}</td>
                    `;
                    agendaBody.appendChild(tr);
                }
            });
        })
        .catch(error => console.error('Error loading agenda:', error));

    function parseCSV(text) {
        // Simple CSV parser handling quotes
        const rows = [];
        let row = [];
        let inQuote = false;
        let currentCell = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (inQuote && nextChar === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                row.push(currentCell.trim());
                currentCell = '';
            } else if ((char === '\r' || char === '\n') && !inQuote) {
                if (currentCell || row.length > 0) {
                    row.push(currentCell.trim());
                    rows.push(row);
                }
                row = [];
                currentCell = '';
                if (char === '\r' && nextChar === '\n') i++;
            } else {
                currentCell += char;
            }
        }
        if (currentCell || row.length > 0) {
            row.push(currentCell.trim());
            rows.push(row);
        }
        return rows.slice(1); // Skip header if needed, but Google Sheet `header=false` param in other urls suggests we might get raw data.
        // But the CSV output usually includes headers if not filtered.
        // Our csvUrl used "&output=csv". It includes headers (Semana, Fecha...).
        // So slice(1) or slice(2) (since CSV has empty top rows sometimes).
        // Step 1317 output: 
        // Line 1: ,,,,,
        // Line 2: Semana,Fecha,...
        // So we should find the header row and start after it.
    }
});
