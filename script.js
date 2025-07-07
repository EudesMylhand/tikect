    document.addEventListener('DOMContentLoaded', function() {
            const fileInput = document.getElementById('fileInput');
            const printButton = document.getElementById('printButton');
            const pagesContainer = document.getElementById('pagesContainer');
            const applySettingsBtn = document.getElementById('applySettings');
            const zoomLevel = document.getElementById('zoomLevel');
            const zoomValue = document.getElementById('zoomValue');
            
            // Paramètres configurables
            const paddingValue = document.getElementById('paddingValue');
            const paddingUnit = document.getElementById('paddingUnit');
            const cellHeight = document.getElementById('cellHeight');
            const cellHeightUnit = document.getElementById('cellHeightUnit');
            const fontSize = document.getElementById('fontSize');
            const fontSizeUnit = document.getElementById('fontSizeUnit');
            
            let currentData = null;
            let currentHeaders = null;
            
            fileInput.addEventListener('change', handleFileUpload);
            printButton.addEventListener('click', printDocument);
            applySettingsBtn.addEventListener('click', applySettings);
            zoomLevel.addEventListener('input', updateZoom);
            
            function updateZoom() {
                const zoom = zoomLevel.value;
                zoomValue.textContent = `${zoom}%`;
                pagesContainer.style.zoom = `${zoom}%`;
            }
            
            function applySettings() {
                if (currentData && currentHeaders) {
                    generatePages(currentHeaders, currentData);
                }
            }
            
            function handleFileUpload(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const fileExtension = file.name.split('.').pop().toLowerCase();
                
                if (fileExtension === 'csv') {
                    processCSVFile(file);
                } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
                    processExcelFile(file);
                } else {
                    alert('Format de fichier non supporté. Veuillez utiliser un fichier CSV ou XLS.');
                }
            }
            
            function processCSVFile(file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    processCSV(content);
                };
                reader.readAsText(file);
            }
            
            function processExcelFile(file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    processExcelData(jsonData);
                };
                reader.readAsArrayBuffer(file);
            }
            
            function processCSV(csvContent) {
                const lines = csvContent.split('\n').filter(line => line.trim() !== '');
                const dataLines = lines.filter(line => !line.startsWith('>'));
                
                // Détection automatique du séparateur
                const separator = detectSeparator(dataLines[0]);
                const headers = dataLines[0].split(separator)
                    .map(header => header.trim())
                    .filter(header => header !== '');
                
                const data = [];
                for (let i = 1; i < dataLines.length; i++) {
                    const values = dataLines[i].split(separator)
                        .map(value => value.trim())
                        .filter(value => value !== '');
                    
                    if (values.length === headers.length) {
                        const entry = {};
                        headers.forEach((header, index) => {
                            entry[header] = values[index];
                        });
                        data.push(entry);
                    }
                }
                
                currentHeaders = headers;
                currentData = data;
                generatePages(headers, data);
            }
            
            function detectSeparator(line) {
                const separators = [',', ';', '|', '\t'];
                let maxCount = 0;
                let detectedSeparator = ',';
                
                for (const sep of separators) {
                    const count = line.split(sep).length - 1;
                    if (count > maxCount) {
                        maxCount = count;
                        detectedSeparator = sep;
                    }
                }
                
                return detectedSeparator;
            }
            
            function processExcelData(excelData) {
                if (excelData.length === 0) return;
                
                const headers = excelData[0].map(header => header.toString().trim());
                const data = [];
                
                for (let i = 1; i < excelData.length; i++) {
                    const values = excelData[i];
                    if (!values || values.length === 0) continue;
                    
                    const entry = {};
                    headers.forEach((header, index) => {
                        entry[header] = values[index] !== undefined ? values[index].toString() : '';
                    });
                    data.push(entry);
                }
                
                currentHeaders = headers;
                currentData = data;
                generatePages(headers, data);
            }
            
            function generatePages(headers, data) {
                pagesContainer.innerHTML = '';
                
                if (data.length === 0) {
                    pagesContainer.innerHTML = '<p>Aucune donnée à afficher.</p>';
                    return;
                }
                
                // Appliquer les paramètres
                const padding = `${paddingValue.value}${paddingUnit.value}`;
                const cellHeightVal = `${cellHeight.value}${cellHeightUnit.value}`;
                const fontSizeVal = `${fontSize.value}${fontSizeUnit.value}`;
                
                const itemsPerPage = 13 * 5;
                const totalPages = Math.ceil(data.length / itemsPerPage);
                
                for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                    const page = document.createElement('div');
                    page.className = 'page';
                    
                    const pageContent = document.createElement('div');
                    pageContent.className = 'page-content';
                    pageContent.style.padding = padding;
                    
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'page-table-container';
                    
                    const startIdx = pageNum * itemsPerPage;
                    const endIdx = Math.min(startIdx + itemsPerPage, data.length);
                    const pageData = data.slice(startIdx, endIdx);
                    
                    const table = document.createElement('table');
                    
                    // Appliquer le style aux cellules
                    const style = document.createElement('style');
                    style.textContent = `
                        td {
                            height: ${cellHeightVal};
                            font-size: ${fontSizeVal};
                        }
                    `;
                    document.head.appendChild(style);
                    
                    let dataIndex = 0;
                    
                    for (let i = 0; i < 13; i++) {
                        const row = document.createElement('tr');
                        
                        for (let j = 0; j < 5; j++) {
                            const cell = document.createElement('td');
                            
                            if (dataIndex < pageData.length) {
                                const item = pageData[dataIndex];
                                let cellContent = '';
                                headers.forEach(header => {
                                    cellContent += `<div><strong>${header}:</strong> ${item[header] || ''}</div>`;
                                });
                                cell.innerHTML = cellContent;
                                dataIndex++;
                            } else {
                                let cellContent = '';
                                headers.forEach(header => {
                                    cellContent += `<div><strong>${header}:</strong> </div>`;
                                });
                                cell.innerHTML = cellContent;
                            }
                            row.appendChild(cell);
                        }
                        
                        table.appendChild(row);
                    }
                    
                    tableContainer.appendChild(table);
                    pageContent.appendChild(tableContainer);
                    
                    const pageNumber = document.createElement('div');
                    pageNumber.className = 'page-number';
                    pageNumber.textContent = `Page ${pageNum + 1} sur ${totalPages}`;
                    pageContent.appendChild(pageNumber);
                    
                    page.appendChild(pageContent);
                    pagesContainer.appendChild(page);
                }
            }
            
            function printDocument() {
                window.print();
            }
        });