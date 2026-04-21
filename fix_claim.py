import sys, re

with open('backend/controllers/claimController.js', 'r', encoding='utf-8') as f:
    text = f.read()

new_text = re.sub(
    r'<<<<<<< HEAD.*?=======.*?const claimantName = req\.user\.fullName \|\| .Someone.;.*?const notification = await Notification\.create.*?\}\);.*?const io = req\.app\.get\(.io.\);.*?if \(io\) \{.*?io\.to\(item\.postedBy\.toString\(\)\)\.emit\(.new_notification., notification\);.*?>>>>>>> 4feb2d9fb33aa9fd298106c9ef3c55de9a0e95c7',
    '''        const claimantName = req.user?.fullName || 'Someone';
        const itemOwner = await User.findById(item.postedBy).select('notificationsEnabled');

        if (!itemOwner || itemOwner.notificationsEnabled !== false) {
            const notification = await Notification.create({
                recipient: item.postedBy,
                type: 'claim',
                title: 'New Claim Received',
                message: \ submitted a claim for your post \"\\".,
                relatedId: claim._id,
                relatedModel: 'Claim',
                itemType: itemType,
                itemId: item._id,
            });

            const io = req.app.get('io');
            if (io) {
                io.to(item.postedBy.toString()).emit('new_notification', notification);
            }
        }''', text, flags=re.DOTALL)

if text == new_text:
    print('No match found!')
else:
    with open('backend/controllers/claimController.js', 'w', encoding='utf-8', newline='') as f:
        f.write(new_text)
    print('Successfully applied replace!')
