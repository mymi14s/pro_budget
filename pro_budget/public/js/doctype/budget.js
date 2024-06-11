frappe.ui.form.on('Budget', {
    refresh: function(frm) {
        frm.set_query('custom_monthly_distribution', 'accounts', () => {
            return {
                filters: {
                    fiscal_year: frm.doc.fiscal_year
                }
            }
        })
    }
});

