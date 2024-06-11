frappe.ui.form.on('Monthly Distribution', {
    validate: function(frm) {
        let total_percentage = frm.doc.percentages.reduce(
            (accumulator, currentObject) => {
            return accumulator + currentObject.percentage_allocation;
        }, 0);
        if (total_percentage >= 101){
            frappe.throw(`Total percentage should not be greater than 100.\
                It us currently ${total_percentage}`);
        }
    }
});

frappe.ui.form.on('Monthly Distribution Percentage', {
    percentage_allocation: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.percentage_allocation > 100){
            frappe.throw(`Percentage on row ${row.idx} should not be greater than 100.`);
        }
    }
});

