var fs = require('fs');

/**
 * Created by nikolaialeksandrenko on 2/12/14.
 */
exports.upload = function(name, public_folder, image, handler) {
    if(image) {
        if(image.size != 0) {
            var fileType = image.type;
            var root = __dirname + "/../public/";

            if(fileType === 'image/gif' || fileType === 'image/jpeg' || fileType === 'image/jpg' || fileType === 'image/png') {
                fs.readFile(image.path, function (err, data) {
                    var newPath = '/' + public_folder + '/' + name;
                    fs.writeFile(root + newPath, data, function (err) {
                        handler(err, newPath);
                    });
                });
            } else {
                handler('Image is not gif, jpeg, jpg or png file.', '');
            }
        } else {
            handler('Image is defined but with 0 kb', '');
        }
    } else {
        handler('Image can not me undefined.', '');
    }
}