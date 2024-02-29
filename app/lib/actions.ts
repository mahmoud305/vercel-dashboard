// import { State } from './actions';
"use server";
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const formSchema = z.object({
    id: z.string(),
    customerId: z.string({invalid_type_error:"Please Select a customer.",}),
    amount: z.coerce.number({invalid_type_error:"Money should be numbers only",}).gt(0,{message:"Please enter an amount greater than 0$."}),// input type number returns a sting :)
    status: z.enum(["pending", "paid"],{invalid_type_error:"Please select an invoice status."} ),
    date: z.string(),
});

const CreateInvoice = formSchema.omit({ id: true, date: true });

// export type State = {
//     errors?: {
//       customerId?: string[];
//       amount?: string[];
//       status?: string[];
//     };
//     message?: string | null;
//   };

export const createInvoice = async (prevState:any,formdata: FormData) => {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formdata.get('customerId'),
        amount: formdata.get("amount"),
        status: formdata.get("status")
    })
    // Test it out:
    //   console.log(rawFormData);
    //   console.log("---------------------------");
    //   console.log(zraw);
    if(!validatedFields.success){
        console.log(validatedFields);
        return {
            errors:validatedFields.error.flatten().fieldErrors,
            message:"invalid fields, failed to create invoice."
            
        }
        
    }
    const { amount, customerId, status } =validatedFields.data;
    const amountInCents = amount * 100;// Converting the amount to cents.
    const date = new Date().toISOString().split('T')[0];
    // console.log(new Date());

    // console.log(rawFormData);

    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date) 
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;

    } catch (error) {
     return{message:"data base error failed to create invoices".toLocaleUpperCase}   
    }
        //Calling revalidatePath to clear the client cache and make a new server request.
//Calling redirect to redirect the user to the invoice's page.
    revalidatePath("/dashboard/invoices"); // to clear the cache to make a request to the server to get the new added invoice
    redirect("/dashboard/invoices");//then redirect to that url.
}

// Use Zod to update the expected types
const UpdateInvoice = formSchema.omit({ id: true, date: true });

export const updateInvoice = async (id: string , prevState:any,formData: FormData) => {
    const validatedform= UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
if(!validatedform.success){
    return {
        errors:validatedform.error.flatten().fieldErrors,
        message:"Missing fields, Failed to Update Invoice"
    }
}
    const { customerId, amount, status } = validatedform.data;
    const amountInCents = amount * 100;
try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
    
} catch (error) {
    return {message:"error in database cannnot update invoice"}
}
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}


export async function deleteInvoice (id:string){
  throw new Error("failed to delete invoice");
    try {
      await sql`delete from invoices WHERE id= ${id}`;
      revalidatePath('/dashboard/invoices'); //
  } catch (error) {
    return {message:"Error In Database Cannot Delete Invoice"};
  }
    /**
     * Since this action is being called in the /dashboard/invoices path, you don't need to call redirect.
     * Calling revalidatePath will trigger a new server request and re-render the table.
     */
} 