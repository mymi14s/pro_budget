import frappe
from frappe import _


def validate(doc, event=None):
    """_summary_

    Args:
        doc (Budegt): _description_
        event (validate): _description_

    First check that if Apply Monthly Distribution is checked,
    the distribution table for accounts must have Monthly Distribution
    value set.
    """
    try:
        if doc.custom_apply_monthly_distribution:
            # validate the accounts distribution table
            monthly_distibution_data = {
                'January':0, 'February':0, 'March':0, 'April':0,
                'May':0, 'June':0, 'July':0, 'August':0,
                'September':0, 'October': 0, 'November': 0, 'December': 0
            }
            for i in doc.accounts:
                if not i.custom_monthly_distribution:
                    frappe.throw(_("Monthly Distribution in row {idx} must be set in Budget Accounts if 'Apply Monthly Distribution' is checked.".format(idx=i.idx)))
                else:
                    if not (frappe.db.exists(
                        "Budget Account Monthly Distribution",
                        {'name':i.custom_monthly_distribution}
                        )):
                        frappe.throw("Monthly Distribution in row {idx} does not exist or has been deleted.".format(i.idx))
                    else:
                        account_monthly_distibution = frappe.get_doc(
                            "Budget Account Monthly Distribution",
                            i.custom_monthly_distribution
                        )
                        # get the monthly budget amount for each
                        for accout_budget_amount in account_monthly_distibution.percentages:
                            monthly_distibution_data[accout_budget_amount.month] += accout_budget_amount.custom_amount_allocation
            monthly_distibution_data_total = round(sum(monthly_distibution_data.values()), 2) 
            doc = create_update_distribution(doc, monthly_distibution_data, monthly_distibution_data_total)
    except Exception as e:
        frappe.log_error(message=frappe.get_traceback(), title='Budget')
        frappe.throw(str(e))


def create_update_distribution(doc, monthly_distibution_data, monthly_distibution_data_total):
    """_summary_

    Args:
        doc (_type_): _description_
        monthly_distibution_data (_type_): _description_
        monthly_distibution_data_total (_type_): _description_
    """
    if doc.monthly_distribution:
        monthly_distribution = frappe.get_doc("Monthly Distribution", doc.monthly_distribution)
        for i in monthly_distribution.percentages:
            i.custom_amount_allocation = monthly_distibution_data[i.month]
            i.percentage_allocation = i.custom_amount_allocation/monthly_distibution_data_total * 100
        monthly_distribution.save()
    else:
        # create monthly distribution
        monthly_distribution = frappe.get_doc({
            'doctype': 'Monthly Distribution',
            'distribution_id':doc.name,
            'fiscal_year': doc.fiscal_year,
            'percentages': [
                {
                    'month':key,
                    'custom_amount_allocation':value,
                    'percentage_allocation': value/monthly_distibution_data_total * 100
                } for key, value in monthly_distibution_data.items()
            ]
        }).insert(ignore_permissions=1)
        doc.monthly_distribution = monthly_distribution.name
    return doc