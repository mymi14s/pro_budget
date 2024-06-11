// Copyright (c) 2024, Anthony Emmanuel and contributors
// For license information, please see license.txt

frappe.ui.form.on('Budget Account Monthly Distribution', {
	onload(frm) {
		if (frm.doc.__islocal) {
			return frm.call("get_months").then(() => {
				frm.refresh_field("percentages");
			});
		}
	},
	validate: function(frm) {
        let total_percentage = frm.doc.percentages.reduce(
            (accumulator, currentObject) => {
            return accumulator + currentObject.percentage_allocation;
        }, 0);
		console.log(total_percentage, 'percentage')
        if (total_percentage >= 101){
            frappe.throw(`Total percentage should not be greater than 100.\
                It us currently ${total_percentage}`);
        }
    },
	refresh(frm) {
		frm.toggle_display("distribution_id", frm.doc.__islocal);
	},
	budget_amount(frm) {
		set_budget_amount_distribution(frm);
	}
});


let set_budget_amount_distribution = (frm) => {
	if (frm.doc.budget_amount) {
		let monthly_value = frm.doc.budget_amount/12;
		let monthly_percentage = (monthly_value/frm.doc.budget_amount) * 100;
		frm.doc.percentages.forEach(element => {
			element.custom_amount_allocation = monthly_value;
			element.percentage_allocation = monthly_percentage;
		});
		frm.refresh_field('percentages');
	}
}


frappe.ui.form.on('Monthly Distribution Percentage', {
	custom_amount_allocation(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		calculate_amount_allocation(frm, row);
	},
	percentage_allocation(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		calculate_percentage_allocation(frm, row);
		if (row.percentage_allocation > 100){
            frappe.throw(`Percentage on row ${row.idx} should not be greater than 100.`);
        }
	}
});



let calculate_amount_allocation = (frm, row) => {
	let total = 0;
	frm.doc.percentages.forEach(item => {
		total = total + item.custom_amount_allocation;
	})

	frm.doc.percentages.forEach(item => {
		item.percentage_allocation = (item.custom_amount_allocation/total) * 100;
	})

	frm.doc.budget_amount = total;
	frm.refresh_field('budget_amount');
	frm.refresh_field('percentages');
}


// Function to recalculate the amount allocations
let calculate_percentage_allocation = (frm, row) => {

    // Calculate the new amount allocation
	row.custom_amount_allocation = frm.doc.budget_amount * (row.percentage_allocation/ 100);

    // Define the original percentage allocations for each month
    let originalPercentages_value = 0;
	let originalPercentages = []
	frm.doc.percentages.forEach((item, index)=>{
		if (item.idx!=row.idx){
			originalPercentages_value = originalPercentages_value + item.percentage_allocation;
		}
	})
	originalPercentages_value = 100 - originalPercentages_value;
	frm.doc.percentages.forEach((item, index)=>{
		if (item.idx!=row.idx){
			originalPercentages.push(item.percentage_allocation);
		} else {
			originalPercentages.push(originalPercentages_value);
		}
	})

    // Calculate the remaining budget after allocating the new amount
    const remainingBudget = frm.doc.budget_amount - row.custom_amount_allocation;

    // Calculate the sum of the original percentages excluding row
    const sumOfOtherPercentages = originalPercentages.reduce((sum, percentage, index) => {
        return index === row.idx-1 ? sum : sum + percentage;
    }, 0);

    // Calculate the new amount allocations for the other months
    originalPercentages.map((percentage, index) => {
        if (index === row.idx-1) {
			frm.doc.percentages[index].custom_amount_allocation = Number(row.custom_amount_allocation);
			frm.doc.percentages[index].percentage_allocation = Number(
				frm.doc.percentages[index].custom_amount_allocation/frm.doc.budget_amount*100
			);
        } else {
			frm.doc.percentages[index].custom_amount_allocation = Number(
				remainingBudget * (percentage / sumOfOtherPercentages)
			);
			frm.doc.percentages[index].percentage_allocation = Number(
				frm.doc.percentages[index].custom_amount_allocation/frm.doc.budget_amount*100
			);
        }
    });
	frm.refresh_field('budget_amount');
	frm.refresh_field('percentages');

	
}

