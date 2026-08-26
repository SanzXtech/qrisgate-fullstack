app.post('/api/settings', async (req, res) => {
    try {
        const { storeName, profilePic, email, phone, password } = req.body;
        let updateQuery = "UPDATE settings SET ";
        let values = [];
        const setParts = [];
        
        if (storeName !== undefined) {
            values.push(storeName);
            setParts.push(`store_name = $${values.length}`);
        }
        if (profilePic !== undefined) {
            values.push(profilePic);
            setParts.push(`profile_pic = $${values.length}`);
        }
        if (email !== undefined) {
            values.push(email);
            setParts.push(`email = $${values.length}`);
        }
        if (phone !== undefined) {
            values.push(phone);
            setParts.push(`phone = $${values.length}`);
        }
        if (password !== undefined) {
            values.push(password);
            setParts.push(`password = $${values.length}`);
        }
        
        if (values.length > 0) {
            updateQuery += setParts.join(", ") + " WHERE id = 1";
            await client.query(updateQuery, values);
        }
        
        const { rows } = await client.query('SELECT store_name as "storeName", profile_pic as "profilePic", email, phone, password FROM settings WHERE id = 1');
        res.json({ success: true, settings: rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
