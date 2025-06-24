document.addEventListener('DOMContentLoaded', function () {
    // --- EXISTING DOM ELEMENT REFERENCES (CONSOLIDATED/UPDATED) ---
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    // Using existing IDs for toggle button and overlay
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn'); // Renamed from menu-toggle
    const sidebarOverlay = document.getElementById('sidebar-overlay'); // If you have an overlay div

    const profileDropdownBtn = document.getElementById('profileDropdownBtn'); // Assuming this ID exists
    const profileDropdownMenu = document.getElementById('profileDropdownMenu'); // Assuming this ID exists
    const logoutLink = document.getElementById('logoutLink'); // Assuming this ID exists

    const transactionTypeDropdownBtn = document.querySelector('.dropdown-toggle'); // Adjusted selector
    const transactionTypeDropdownMenu = document.querySelector('.dropdown-menu'); // Adjusted selector
    const transactionTypeLinks = document.querySelectorAll('.dropdown-menu a'); // Adjusted selector

    const filterBtn = document.getElementById('filterBtn'); // Existing button
    const startDateInput = document.getElementById('startDate'); // Existing input
    const endDateInput = document.getElementById('endDate'); // Existing input

    const searchInput = document.getElementById('searchInput'); // Assuming this ID exists for the main search
    const searchBtn = document.getElementById('searchBtn'); // Assuming this ID exists for the search button

    const newTransactionBtn = document.querySelector('.action-buttons .btn-primary'); // Selector for "New Transaction" button

    // --- NEW GLOBAL VARIABLE TO STORE ITEMS FOR THE CURRENT TRANSACTION ---
    let currentTransactionItems = [];

    // --- REVISED: closeAllDialogs function ---
    // Why: To ensure all dialogs and their overlays are properly removed and body scrolling is re-enabled.
    function closeAllDialogs() {
        const existingDialogOverlays = document.querySelectorAll('.dialog-overlay');
        existingDialogOverlays.forEach(overlay => overlay.remove()); // Remove all active dialog overlays
        document.body.style.overflow = ''; // Re-enable scrolling on the body
    }

    // --- EXISTING SIDEBAR TOGGLE FUNCTIONALITY (ADAPTED TO NEW IDs) ---
    if (toggleSidebarBtn && sidebar && sidebarOverlay) {
        toggleSidebarBtn.addEventListener('click', function () {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // --- EXISTING PROFILE DROPDOWN LOGIC (ADAPTED TO NEW IDs) ---
    if (profileDropdownBtn && profileDropdownMenu) {
        profileDropdownBtn.addEventListener('click', (event) => {
            profileDropdownMenu.classList.toggle('show');
            event.stopPropagation();
        });
        document.addEventListener('click', (event) => {
            if (!profileDropdownBtn.contains(event.target) && !profileDropdownMenu.contains(event.target)) {
                profileDropdownMenu.classList.remove('show');
            }
        });
    }

    // --- EXISTING LOGOUT LOGIC ---
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/logout', { method: 'POST' });
                if (response.ok) {
                    window.location.href = '/login';
                } else {
                    alert('Failed to logout.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }

    // --- EXISTING TRANSACTION TYPE DROPDOWN LOGIC (ADAPTED TO NEW IDs) ---
    if (transactionTypeDropdownBtn && transactionTypeDropdownMenu) {
        transactionTypeDropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            transactionTypeDropdownMenu.style.display = transactionTypeDropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', function () {
            transactionTypeDropdownMenu.style.display = 'none';
        });

        transactionTypeDropdownMenu.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        if (transactionTypeLinks.length > 0) {
            transactionTypeLinks.forEach(link => {
                link.addEventListener('click', function (event) {
                    event.preventDefault();
                    const type = this.getAttribute('data-type');
                    // This is where the page reloads with the new type query parameter
                    window.location.href = `/type/transaction?type=${type}`;
                });
            });
        }
    }


    // --- EXISTING DATE FILTER LOGIC ---
    if (filterBtn && startDateInput && endDateInput) {
        filterBtn.addEventListener('click', function () {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const currentUrl = new URL(window.location.href);
            if (startDate) {
                currentUrl.searchParams.set('startDate', startDate);
            } else {
                currentUrl.searchParams.delete('startDate');
            }
            if (endDate) {
                currentUrl.searchParams.set('endDate', endDate);
            } else {
                currentUrl.searchParams.delete('endDate');
            }
            window.location.href = currentUrl.toString();
        });
    }

    // --- EXISTING SEARCH FUNCTIONALITY ---
    if (searchBtn && searchInput) { // Ensure both elements exist
        searchBtn.addEventListener('click', function () {
            const searchQuery = searchInput.value;
            const currentUrl = new URL(window.location.href);
            if (searchQuery) {
                currentUrl.searchParams.set('search', searchQuery);
            } else {
                currentUrl.searchParams.delete('search');
            }
            window.location.href = currentUrl.toString();
        });
    }
    // Also re-add keyup for search input if desired (from original)
    if (searchInput) {
        searchInput.addEventListener('keyup', function (e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim(); // Removed toLowerCase() for exact match if needed
                const currentUrl = new URL(window.location.href);
                if (searchTerm.length > 0) {
                    currentUrl.searchParams.set('search', searchTerm);
                } else {
                    currentUrl.searchParams.delete('search');
                }
                window.location.href = currentUrl.toString();
            }
        });
    }

    // --- EXISTING PAGINATION FUNCTIONALITY (ADAPTED) ---
    // Assuming pagination buttons are now handled by backend rendering URLs
    document.querySelectorAll('.pagination-btn').forEach(button => { // Changed from .pagination-number
        button.addEventListener('click', function (event) {
            event.preventDefault();
            const page = this.getAttribute('data-page'); // Assuming data-page attribute for URL
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('page', page);
            window.location.href = currentUrl.toString();
        });
    });

    // --- EXISTING TABLE SELECTION FUNCTIONALITY ---
    const selectAllCheckbox = document.getElementById('select-all');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');

    if (selectAllCheckbox && rowCheckboxes.length > 0) {
        selectAllCheckbox.addEventListener('change', function () {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                updateRowSelection(checkbox);
            });
        });

        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                updateRowSelection(this);

                const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
                const someChecked = Array.from(rowCheckboxes).some(cb => cb.checked);

                selectAllCheckbox.checked = allChecked;
                selectAllCheckbox.indeterminate = someChecked && !allChecked;
            });

            updateRowSelection(checkbox);
        });
    }

    function updateRowSelection(checkbox) {
        const row = checkbox.closest('tr');
        if (row) {
            if (checkbox.checked) {
                row.classList.add('selected-row');
            } else {
                row.classList.remove('selected-row');
            }
        }
    }

    // --- EXISTING CALENDAR INPUT FUNCTIONALITY (ADAPTED) ---
    // Replaced specific classes/IDs with more generic ones or removed if not directly used
    // Assuming date inputs are simple HTML5 type="date"
    const dateInputs = document.querySelectorAll('input[type="date"]'); // Broader selector
    if (dateInputs.length > 0) {
        dateInputs.forEach(input => {
            input.addEventListener('change', function () {
                console.log(`Tanggal dipilih: ${this.value}`);
            });
        });
    }

    // --- EXISTING DOWNLOAD BUTTON FUNCTIONALITY ---
    const downloadButton = document.querySelector('.btn-secondary[title="Unduh"]'); // More specific selector

    if (downloadButton) {
        downloadButton.addEventListener('click', function () {
            const selectedRows = document.querySelectorAll('.selected-row');
            const selectedCount = selectedRows.length;

            if (selectedCount > 0) {
                alert(`Downloading data for ${selectedCount} selected transaction(s). In a real application, this would generate a CSV/Excel file.`);
            } else {
                alert('Please select at least one transaction to download.');
            }
        });
    }

    // --- NEW TRANSACTION BUTTON FUNCTIONALITY ---
    // Why: Ensure `currentTransactionItems` is cleared for a fresh transaction.
    if (newTransactionBtn) {
        newTransactionBtn.addEventListener('click', function () {
            currentTransactionItems = []; // Clear the items array for a new transaction
            createTransactionDialog(); // Call the function to open the main transaction dialog
        });
    }

    // --- MODIFIED: createAddItemDialog function ---
    // Why: To collect item data, add to global array, and re-render main dialog.
    function createAddItemDialog() {
        closeAllDialogs(); // Close other dialogs

        const overlay = document.createElement('div');
        overlay.classList.add('dialog-overlay'); // Re-using a generic dialog-overlay class for consistency
        overlay.innerHTML = `
            <div class="dialog-content">
                <h2>Tambah Barang</h2>
                <form id="addItemForm">
                    <div>
                        <label for="itemCode">Kode Barang:</label>
                        <input type="text" id="itemCode" name="itemCode" required>
                    </div>
                    <div>
                        <label for="itemName">Nama Barang:</label>
                        <input type="text" id="itemName" name="itemName" required>
                    </div>
                    <div>
                        <label for="itemBeginn">Bagian:</label>
                        <input type="text" id="itemBeginn" name="itemBeginn">
                    </div>
                    <div>
                        <label for="itemOry">Quantity:</label>
                        <input type="number" id="itemOry" name="itemOry" min="1" value="1" required>
                    </div>
                    <div>
                        <label for="itemDisc">Diskon (%):</label>
                        <input type="number" id="itemDisc" name="itemDisc" min="0" value="0">
                    </div>
                    <div>
                        <label for="itemPrice">Harga Satuan:</label>
                        <input type="number" id="itemPrice" name="itemPrice" min="0" step="0.01" required>
                    </div>
                    <div class="dialog-buttons">
                        <button type="submit" class="btn-primary" id="saveItemButton">Simpan Barang</button>
                        <button type="button" class="btn-secondary" id="cancelItemButton">Batal</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        const saveItemButton = document.getElementById('saveItemButton');
        const cancelItemButton = document.getElementById('cancelItemButton');

        saveItemButton.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default form submission

            const itemCode = document.getElementById('itemCode').value.trim();
            const itemName = document.getElementById('itemName').value.trim();
            const itemBeginn = document.getElementById('itemBeginn').value.trim();
            const itemOry = parseInt(document.getElementById('itemOry').value);
            const itemDisc = parseFloat(document.getElementById('itemDisc').value) || 0;
            const itemPrice = parseFloat(document.getElementById('itemPrice').value) || 0;

            // Why: Client-side validation for item inputs
            if (!itemCode || !itemName || isNaN(itemOry) || itemOry <= 0 || isNaN(itemPrice) || itemPrice < 0) {
                alert('Harap isi Kode Barang, Nama Barang, Quantity (min 1), dan Harga Satuan (min 0) dengan benar.');
                return;
            }

            const subtotal = (itemOry * itemPrice) * (1 - (itemDisc / 100)); // Calculate subtotal with discount

            const newItem = {
                kode_barang: itemCode,
                nama_barang: itemName,
                bagian: itemBeginn,
                qty: itemOry,
                disc: itemDisc,
                harga_satuan: itemPrice,
                subtotal: subtotal
            };

            currentTransactionItems.push(newItem); // Why: Add the new item to our temporary array
            alert('Barang berhasil ditambahkan ke transaksi!');
            createTransactionDialog(); // Why: Re-open main dialog to show updated item list
        });

        cancelItemButton.addEventListener('click', function () {
            createTransactionDialog(); // Go back to the main transaction dialog
        });
    }

    // --- MODIFIED: createTransactionDialog function ---
    // Why: To dynamically display items, calculate totals, and handle save logic.
    function createTransactionDialog() {
        closeAllDialogs(); // Close any open dialogs

        const overlay = document.createElement('div');
        overlay.classList.add('dialog-overlay'); // Re-using generic class
        
        // Why: Dynamically generate HTML for the items table based on `currentTransactionItems`
        let itemsHtml = '';
        let totalItemsAmount = 0; // Sum of subtotals from currentTransactionItems

        if (currentTransactionItems.length > 0) {
            currentTransactionItems.forEach((item, index) => {
                itemsHtml += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.kode_barang}</td>
                        <td>${item.nama_barang}</td>
                        <td>${item.bagian || '-'}</td>
                        <td>${item.qty}</td>
                        <td>${item.disc}%</td>
                        <td>Rp ${item.harga_satuan.toLocaleString('id-ID')}</td>
                        <td>Rp ${item.subtotal.toLocaleString('id-ID')}</td>
                    </tr>
                `;
                totalItemsAmount += item.subtotal; // Accumulate total
            });
        } else {
            itemsHtml = '<tr><td colspan="8">Belum ada barang ditambahkan.</td></tr>';
        }

        overlay.innerHTML = `
            <div class="dialog-content">
                <h2>Input Transaksi</h2>
                <form id="transactionForm">
                    <div>
                        <label for="inputDate">Tgl. Input Transaksi:</label>
                        <input type="date" id="inputDate" name="inputDate" required>
                    </div>
                    <div>
                        <label for="dueDate">Tgl. Jatuh Tempo:</label>
                        <input type="date" id="dueDate" name="dueDate" required>
                    </div>
                    <div>
                        <label for="invoiceCode">Kode Invoice:</label>
                        <input type="text" id="invoiceCode" name="invoiceCode" required>
                    </div>
                    <div>
                        <label for="docType">Jenis Dok. Transaksi:</label>
                        <input type="text" id="docType" name="docType" placeholder="Contoh: Pembelian/Penjualan" required>
                    </div>
                    <div>
                        <label for="supplierName">Nama Supplier/Cust:</label>
                        <input type="text" id="supplierName" name="supplierName" required>
                    </div>
                    <div>
                        <label for="invoiceDate">Tanggal Invoice:</label>
                        <input type="date" id="invoiceDate" name="invoiceDate" required>
                    </div>
                    
                    <button type="button" class="btn-primary" id="addItemButton" style="margin-bottom: 16px;">Tambah Barang</button>
                    
                    <h3>Daftar Barang</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode Barang</th>
                                <th>Nama Barang</th>
                                <th>Bagian</th>
                                <th>Qty</th>
                                <th>Disc</th>
                                <th>Harga Satuan</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div style="margin-top: 20px;">
                        <h3>Total Transaksi</h3>
                        <div>
                            <label for="debit">Debit (Pemasukan):</label>
                            <input type="text" id="debit" name="debit" value="${totalItemsAmount.toLocaleString('id-ID')}" readonly>
                        </div>
                        <div>
                            <label for="credit">Kredit (Pengeluaran):</label>
                            <input type="text" id="credit" name="credit" value="0" readonly>
                        </div>
                        <div>
                            <label for="balance">Saldo:</label>
                            <input type="text" id="balance" name="balance" value="${totalItemsAmount.toLocaleString('id-ID')}" readonly>
                        </div>
                    </div>

                    <div class="dialog-buttons">
                        <button type="submit" class="btn-primary" id="saveButton">Simpan</button>
                        <button type="button" class="btn-secondary" id="cancelButton">Batal</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        // Re-attach event listeners because dialog.innerHTML overwrites them
        const addItemButton = document.getElementById('addItemButton');
        addItemButton.addEventListener('click', createAddItemDialog);

        const cancelButton = document.getElementById('cancelButton');
        cancelButton.addEventListener('click', closeAllDialogs);

        const saveButton = document.getElementById('saveButton');
        saveButton.addEventListener('click', async function (e) {
            e.preventDefault(); // Why: Prevent the default form submission behavior

            // --- Collect all form data ---
            const inputDate = document.getElementById('inputDate').value;
            const dueDate = document.getElementById('dueDate').value;
            const invoiceCode = document.getElementById('invoiceCode').value.trim();
            const docType = document.getElementById('docType').value.trim(); // e.g., "Pembelian", "Penjualan"
            const supplierName = document.getElementById('supplierName').value.trim();
            const invoiceDate = document.getElementById('invoiceDate').value;

            // Why: Determine transaction type for backend logic (cash flow and model type)
            // Assuming 'Penjualan' leads to 'pemasukan' and 'Pembelian' leads to 'pengeluaran'
            const jenisTransaksi = docType.toLowerCase().includes('penjualan') ? 'pemasukan' : 'pengeluaran';

            // Why: Use the calculated totalItemsAmount for the transaction's value
            let finalDebitAmount = 0;
            let finalCreditAmount = 0;
            if (jenisTransaksi === 'pemasukan') { // If it's income (e.g., Sale)
                finalDebitAmount = totalItemsAmount;
            } else { // If it's an expense (e.g., Purchase)
                finalCreditAmount = totalItemsAmount;
            }
            const finalBalanceAmount = finalDebitAmount - finalCreditAmount;

            // Why: Client-side validation before sending data to server
            if (!inputDate || !dueDate || !invoiceCode || !docType || !supplierName || !invoiceDate) {
                alert('Harap isi semua bidang detail transaksi (Tanggal Input, Jatuh Tempo, Kode Invoice, Jenis Dokumen, Nama Supplier/Customer, Tanggal Invoice).');
                return;
            }

            if (currentTransactionItems.length === 0) {
                alert('Harap tambahkan setidaknya satu barang ke transaksi sebelum menyimpan!');
                return;
            }

            // Why: Assemble all data into a single object for the POST request
            const transactionData = {
                inputDate,
                dueDate,
                invoiceCode,
                docType,
                supplierName,
                invoiceDate,
                debit: finalDebitAmount,   // Amount for debit side (or income)
                credit: finalCreditAmount, // Amount for credit side (or expense)
                balance: finalBalanceAmount,
                items: currentTransactionItems, // The crucial array of collected item objects
                jenis_transaksi: jenisTransaksi // 'pemasukan' or 'pengeluaran' for backend logic
            };

            console.log('Sending transaction data:', transactionData); // For debugging

            try {
                // Why: Send data to the backend using fetch API
                const response = await fetch('/type/create', { // This is the new route we'll define
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' // Tell the server we're sending JSON
                    },
                    body: JSON.stringify(transactionData) // Convert JavaScript object to JSON string
                });

                const result = await response.json(); // Why: Parse the JSON response from the server

                if (response.ok && result.success) { // Why: Check if the request was successful
                    alert('Transaksi berhasil disimpan!');
                    closeAllDialogs(); // Why: Close dialog on success
                    currentTransactionItems = []; // Why: Clear items for next new transaction
                    location.reload(); // Why: Reload page to display the newly added transaction
                } else {
                    // Why: Display error message from the backend if available
                    alert('Gagal menyimpan transaksi: ' + (result.message || 'Terjadi kesalahan tidak diketahui.'));
                }
            } catch (error) {
                console.error('Error saving transaction:', error); // Log network or other errors
                alert('Terjadi kesalahan koneksi saat menyimpan transaksi.');
            }
        });
    }

    // --- EXISTING GENERAL STYLING INJECTION (keep as is) ---
    // You might already have these in a .css file, if so, remove these script-injected styles.
    const style = document.createElement('style');
    style.innerHTML = `
        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .dialog-content {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            max-width: 600px; /* Adjust as needed */
            max-height: 80vh;
            overflow-y: auto;
            position: relative; /* For z-index to work against overlay */
        }
        .dialog-content h2 {
            margin-top: 0;
            font-size: 1.5em;
            color: #333;
        }

        .dialog-content label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #555;
        }

        .dialog-content input[type="text"],
        .dialog-content input[type="number"],
        .dialog-content input[type="date"] {
            width: calc(100% - 16px); /* Account for padding */
            padding: 8px;
            margin-bottom: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        .dialog-content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .dialog-content table th,
        .dialog-content table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
        }

        .dialog-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 16px;
        }

        .dialog-buttons button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .dialog-buttons .btn-primary {
            background-color: #007bff;
            color: #fff;
        }

        .dialog-buttons .btn-secondary {
            background-color: #6c757d;
            color: #fff;
        }
    `;
    document.head.appendChild(style);

    // --- OTHER EXISTING FUNCTIONALITIES (Keep as is, mostly unchanged from your original) ---

    // Filter button functionality
    const filterButton = document.querySelector('.btn-icon'); // Assuming this refers to the filter dropdown/modal button

    if (filterButton) {
        filterButton.addEventListener('click', function () {
            alert('This would open advanced filtering options. In a real application, this might show a dropdown or modal with filter criteria.');
        });
    }

    // Notification bell functionality
    const notificationBell = document.querySelector('.header-right .fa-bell');

    if (notificationBell) {
        notificationBell.addEventListener('click', function () {
            alert('This would show notifications. In a real application, this would display a dropdown with recent notifications.');
        });
    }

    // Make status cells clickable to show status history
    const statusCells = document.querySelectorAll('td .status');

    if (statusCells.length > 0) {
        statusCells.forEach(status => {
            status.addEventListener('click', function () {
                const statusText = this.textContent;
                const transactionCode = this.closest('tr').cells[1].textContent;
                alert(`Status history for ${transactionCode}: ${statusText}. In a real application, this would show a modal with the full status history.`);
            });

            status.style.cursor = 'pointer';
        });
    }

    // Add row hover effect
    const tableRows = document.querySelectorAll('tbody tr');

    if (tableRows.length > 0) {
        tableRows.forEach(row => {
            row.addEventListener('mouseenter', function () {
                if (!this.classList.contains('selected-row')) {
                    this.style.backgroundColor = '#f9fafb';
                }
            });

            row.addEventListener('mouseleave', function () {
                if (!this.classList.contains('selected-row')) {
                    this.style.backgroundColor = '';
                }
            });
        });
    }

    // Profile Dropdown Functionality
    const userProfile = document.getElementById('user-profile'); // Make sure this ID exists

    if (userProfile) {
        userProfile.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('active');
        });

        document.addEventListener('click', function (e) {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });

        const dropdownMenu = userProfile.querySelector('.profile-dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
    }
}); // End of DOMContentLoaded