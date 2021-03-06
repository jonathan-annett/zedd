/*jshint maxerr: 10000 */
/*global define*/
(function(/*node>>>*/isNodeJS/*<<<node*/ ){
(function(
    exports, 
    define
    ) {
        
    const /*node>>>*/
    strip_browser_logging = false ?/(^([\ |\t]*log\(.*?);)|(^([\ |\t]*const log\s\=\s[a-z|A-Z]+[a-z|A-Z|0-9]\.log\;$))/gm : false,
    /*<<<node*/
    logging=function(fn,state){
        const prefix = fn.name+":";
        fn.log=state ? console.log.bind(console,prefix) : function(){ };
    },
    logReturn = console.log.bind(console);
    
        
    const sha1 = sha1Lib();
    
    const cpArgs = Array.prototype.slice.call.bind (Array.prototype.slice);
    
    const upgrade_header_name = 'x-hashdiffmware';
    const upgrade_header_value = 'upgrade';
    const upgrade_headers = {};
    upgrade_headers [upgrade_header_name]=upgrade_header_value;


    
    function forwardSubstring(origin, start, length, hash, hasher,key) {
        var self = {};
        var impl = {};
        impl.type = {
            value: "forward",
            writeable: false,
            enumerable: false
        };
        impl.value = {
            get: typeof key==='string' ? function() {
                return origin[key].substr(start, length);
            } : function() {
                return origin.substr(start, length);
            },
            set: function(v) {}
        };

        impl.length = {
            get: function() {
                return length;
            },
            set: function(v) {
                length = v;
            }
        };
        impl.start = {
            get: function() {
                return start;
            },
            set: function(v) {
                start = v;
            }
        };
        impl.end = {
            get: function() {
                return start + length;
            },
            set: function(v) {}
        };
        impl.hash = {
    
            get: function() {
                if (hash === null) {
                    hasher(self.value, function(h) {
                        hash = h;
                    });
                }
                return hash;
            },
    
            set: function(v) {
                if (!v && hasher) {
                    hash = null;
                    hasher(self.value, function(h) {
                        hash = h;
                    });
                } else {
                    hash = v;
                }
            }
    
        };
        impl.needHash = {
            value: function(cb) {
                if (hash) {
                    cb(hash);
                } else  {
                   hasher(self.value, cb);
                }
                return hash;
            },
            enumerable: false
        };
        impl.compare = {
            // returns: false no relationship exists
            // returns true if values are identical
            // returns 0 or a positive number if the value being compared exists inside this value - at that offset
            // returns a negative number if this value exists inside the value being compared : at = 0- that offset
            // returns null if this value exists at the start of the number being compared
            value: function(value, _length) {
                if (typeof _length !== 'number') {
                    _length = value.length;
                }
                if (typeof value === 'object') {
                    if (value.length === length) {
                        // pedantically do this inside an if, as it is pointless doing
                        // an expensive substr on a large string if the lengths don't match.
                        // (both self.value and value.value a getters that pull in values via substrings )
                        return (value.value === self.value);
                    } else {
    
                        if (value.length < length) {
                            const index = self.value.indexOf(value.value);
                            return (index < 0) ? false : index;
                        } else {
                            const index = value.value.indexOf(self.value);
                            return (index < 0) ? false : index === 0 ? null : 0 - index;
                        }
                    }
    
                }
    
                if (_length === length) {
                    return (value === self.value);
                } else {
                    if (_length < length) {
                        const index = self.value.indexOf(value);
                        return (index < 0) ? false : index;
                    } else {
                        const index = value.indexOf(self.value);
                        return (index < 0) ? false : index === 0 ? null : 0 - index;
                    }
                }
            }
        };
        impl.split = {
            value: function(newlength) {
                if (newlength >= length || newlength < 0) {
                    return null;
                }
                const nextPeer = forwardSubstring(origin, start + newlength, length - newlength, false, hasher,key);
                length = newlength;
                self.hash = false;
                return nextPeer;
            }
        };
        Object.defineProperties(self, impl);
        if (hash === null && hasher) {
            hasher(self.value, function(h) {
                hash = h;
            });
        }
        return self;
    }
    
    function reverseSubstring(origin, length, end, hash, hasher,key) {
        var self = {};
        var impl = {};
        impl.type = {
            value: "reverse",
            writeable: false,
            enumerable: false
        };
        impl.value = {
            get: typeof key==='string' ? function() {
                return origin[key].substr(end - length, length);
            } : function() {
                    return origin.substr(end - length, length);
            } ,
            set: function(v) {}
        };
        impl.length = {
            get: function() {
                return length;
            },
            set: function(v) {
                length = v;
            }
        };
        impl.start = {
            get: function() {
                return end - length;
            },
            set: function(v) {}
        };
        impl.end = {
            get: function() {
                return end;
            },
            set: function(v) {
                end = v;
            }
        };
        impl.hash = {
            get: function() {
                if (hash === null) {
                    hasher(self.value, function(h) {
                        hash = h;
                    });
                }
                return hash;
            },
            set: function(v) {
                if (!v && hasher) {
                    hash = null;
                    hasher(self.value, function(h) {
                        hash = h;
                    });
                } else {
                    hash = v;
                }
            }
    
        };
        impl.needHash = {
            value: function(cb) {
                if (hash) {
                    cb(hash);
                } else  {
                   hasher(self.value, cb);
                }
                return hash;
            },
            enumerable: false
        };
        impl.compare = {
            // returns: false no relationship exists
            // returns true if values are identical
            // returns 0 or a positive number if the value being compared exists inside this value - at that offset
            // returns a negative number if this value exists inside the value being compared : at = 0- that offset
            // returns null if this value exists at the start of the number being compared
            value: function(value, _length) {
                if (typeof _length !== 'number') {
                    _length = value.length;
                }
                if (typeof value === 'object') {
                    if (value.length === length) {
                        // pedantically do this inside an if, as it is pointless doing
                        // an expensive substr on a large string if the lengths don't match.
                        // (both self.value and value.value a getters that pull in values via substrings )
                        return (value.value === self.value);
                    } else {
    
                        if (value.length < length) {
                            const index = self.value.indexOf(value.value);
                            return (index < 0) ? false : index;
                        } else {
                            const index = value.value.indexOf(self.value);
                            return (index < 0) ? false : index === 0 ? null : 0 - index;
                        }
                    }
    
                }
    
                if (_length === length) {
                    return (value === self.value);
                } else {
                    if (_length < length) {
                        const index = self.value.indexOf(value);
                        return (index < 0) ? false : index;
                    } else {
                        const index = value.indexOf(self.value);
                        return (index < 0) ? false : index === 0 ? null : 0 - index;
                    }
                }
            }
        };
    
        impl.split = {
            value: function(newlength) {
                if (newlength >= length || newlength < 0) {
                    return null;
                }
                const prevPeer = forwardSubstring(origin, end - length, length - newlength, false, hasher,key);
                length = newlength;
                self.hash = false;
                return prevPeer;
            }
        };
    
        Object.defineProperties(self, impl);
        if (hash === null && hasher) {
            hasher(self.value, function(h) {
                hash = h;
            });
        }
    
    
        return self;
    }
    
    function collectSlices(hasher, slices, origin, length, offset, chunksize, ids, key, cb) {
        // slice a string into chunks, hashing each chunk individually
        // creates two arrays, one in the normal order --eg--> [ 0-1023,   1024-2047, 2048-2147 ]
        // and another in reverse                     --eg--> [ 1124-2147, 100-1123, 0-99      ]
    
        // the idea is, if someone is editing a large file in an editor, it's unlikely they are changing 
        // more than a few bytes at a time, at a specific location in the file.
        // if the area being edit is at the end of the file (eg they are extending an existing file
        // the vast maajority of the 1024 by chunks preceding their edits will remain unchanged
        // likewise if they are ending the start of the file, the same will be true, but since
        // it's most likely they are inserting / deleting rather than overwriting, a forward calclated hash or
        // simple compare won't work. but by hashing in reverse, these cases are easily detected.
        // so, when opening the file, we hash in both directions, in anticipation of edits being made anywhere
        // we don't/can't rely on cursor positons or keystrokes, as this is a transparent proxy that sits over 
        // a file system layer. 
    
        if (!slices) {
            slices = {
                forwards: [],
                backwards: []
            };
        }
    
    
        // force the chunksize to a value where there is a remainder  
        // this is so we have a chunk that's undersized at the end of each array.
        // why ? this way we have distinctly different chunks in reverse
    
        while ((length % chunksize) === 0) {
            chunksize--;
        }
    
    
        while (offset + chunksize < length) {
            slices.forwards.push(forwardSubstring(origin, /*start=*/ offset, /*length=*/ chunksize, false, hasher,key));
            offset += chunksize;
            slices.backwards.push(reverseSubstring(origin, /*start=*/ length - offset, length, /*length=*/ chunksize, false, hasher,key));
        }
    
        const lastChunkSize = length - offset;
    
        if (lastChunkSize > 0) {
            slices.forwards.push(forwardSubstring(origin, /*start=*/ offset, /*length=*/ lastChunkSize, false, hasher, key));
            slices.backwards.push(reverseSubstring(origin, /*start=*/ 0, /*length=*/ lastChunkSize, false, hasher, key));
        }
    
        const hashesArePending = function(x) {
            return x.hash === null;
        };
        const loop_sleep_time = hasher ? Math.floor(1.5 * slices.forwards.length) : 0;
        const doCollect = function() {
    
            // give back some time while crypto hashes the strings
            if (hasher && slices.forwards.some(hashesArePending) || slices.backwards.some(hashesArePending)) {
                return setTimeout(doCollect, loop_sleep_time);
            }
            return cb(slices);
        };
    
        setTimeout(doCollect, loop_sleep_time);
    }
    
    
    logging(openDiffer,true);
    function openDiffer(origin, key, chunksize) {
        const log = openDiffer.log;
        
        chunksize = typeof chunksize === 'number' ? Math.max(chunksize, 128) : 1024;
        
        var 
        value,
        newValue,
        first_update,
        onUpdate = function() {
            // temporaray-while-bootstrapping function. 
            // gets swizzled out once loaded, so this may never get called.
           if (first_update) {
               clearTimeout(first_update);
           }
           if (newValue) {
               first_update = setTimeout(onUpdate, 100);
           } else {
               first_update = undefined;
           }
        };

        
        if (typeof origin==='object' &&
            typeof key+typeof origin[key]==='stringstring'){
                
            // install setter function to automatically propagate changes whenever origin is updated
            value = origin[key];
            delete origin[key];
            
            Object.defineProperty(origin,key,{
                
                get : function(){
                    return value;
                },
                set: function (val) {
                    newValue = val;
                    onUpdate();
                },
                enumerable: true,
                configurable : true
                
            });
        } else {
            value = typeof origin==='string'?origin:'';
        }
        
    
        var 
            
            length = value.length,
            hash = "",
            slices = {
                forwards: [],
                backwards: []
            },
            self = {},
            full_update_needed = true,
            FORWARDS_DATA_BACKWARDS = 0,
            FORWARDS_BACKWARDS = 1,
            DATA_BACKWARDS = 2,
            FORWARDS_DATA = 3,
            FORWARDS = 4,
            BACKWARDS = 5,
            DATA = 6,
    
            nuke = function(list, newlist) {
                list.forEach(function(el) {
                    delete el.value;
                    delete el.hash;
                });
                if (newlist) {
                    list.splice.apply(list, [0, list.length].concat(newlist));
                } else {
                    list.splice(0, slices.list.length);
                }
            },
    
            parse_update = function(msg, callback) {
    
                /*
                
                const updateScript = [
                    
                0    hash,
                1    updating_hash,
                2    updating_length
                
                3
    
                );
                
                */
                if (Array.isArray(msg)) {
    
                    if (msg[0] === hash) {
    
                        const
                        updating_hash = msg[1],
                        updating_length = msg[2],
                        update_mode = msg[3];
    
                        switch (update_mode) {
    
                            case FORWARDS_DATA_BACKWARDS:
                                return parse_FORWARDS_DATA_BACKWARDS(msg);
    
                            case FORWARDS_BACKWARDS:
                                return parse_FORWARDS_BACKWARDS(msg);
    
                            case DATA_BACKWARDS:
                                return parse_DATA_BACKWARDS(msg);
    
                            case FORWARDS_DATA:
                                return parse_FORWARDS_DATA(msg);
    
                            case FORWARDS:
                                return parse_FORWARDS(msg);
    
                            case BACKWARDS:
                                return parse_BACKWARDS(msg);
    
                            case DATA:
                                return parse_DATA(msg);
    
                        }
                    }
                }
    
    
    
                function parse_FORWARDS_DATA_BACKWARDS(msg) {
                    /*msg.push(
                    3   FORWARDS_BACKWARDS,
                    
                    4    matching_forwards.length,
                    5   fwd_len,
                    6   trailing_fwd_hash,
                        
                    7   matching_backwards.length,
                    8   back_len,
                    9   leading_back_hash
                    
                    10  data_hash,
                    11  data
                    
                    */
    
    
                    if (msg.length !== 12) {
    
                        return callback(new Error("sanity check fails: msg.length should be 12"));
                    }
    
                    const
    
                    updating_hash = msg[1],
                    updating_length = msg[2],
    
                    //fwd_count = msg[4],
                    fwd_len = msg[5],
                    //trailing_fwd_hash = msg[6],
    
                    //back_count = msg[7],
                    back_len = msg[8],
                    //leading_back_hash = msg[9],
    
                    data_hash = msg[10],
                    data = msg[11];
    
    
                    if (fwd_len + back_len !== updating_length) {
    
                        return callback(new Error("sanity check fails: fwd+back != length"));
                    }
    
    
                    sha1(data, function(test_hash) {
    
                        if (test_hash !== data_hash) {
                            return callback(new Error("embeded data hash check fails"));
                        }
    
                        parse_FORWARDS_BACKWARDS(msg.slice(0, 10), function(err, leading_data, trailing_data) {
                            if (err) return callback(err);
                            const candidate_data = leading_data + data + trailing_data;
                            sha1(candidate_data, function(test_hash) {
    
                                if (test_hash !== updating_hash) {
                                    return callback(new Error("final hash check fails"));
                                }
    
                                return callback(undefined, candidate_data);
                            });
                        });
    
                    });
    
    
    
                }
    
                function parse_FORWARDS_BACKWARDS(msg, skipFinalHash) {
                    const cb = skipFinalHash ? callback : skipFinalHash;
                    /*msg.push(
                     
                    3   FORWARDS_BACKWARDS,
                    4    matching_forwards.length,
                    5   fwd_len,
                    6   trailing_fwd_hash,
                        
                    7   matching_backwards.length,
                    8   back_len,
                    9   leading_back_hash
                    
                    */
    
    
                    if (msg.length !== 10) {
    
                        return cb(new Error("sanity check fails: msg.length should be 10"));
                    }
    
                    const
    
                    updating_hash = msg[1],
                    updating_length = msg[2],
    
                    fwd_count = msg[4],
                    fwd_len = msg[5],
                    trailing_fwd_hash = msg[6],
    
                    back_count = msg[7],
                    back_len = msg[8],
                    leading_back_hash = msg[9],
                    out = [];
    
    
    
                    if (fwd_len + back_len !== updating_length) {
    
                        return cb(new Error("sanity check fails: fwd+back != length"));
                    }
    
    
    
                    var bytes = 0;
    
                    if (slices.forwards.some(function(x, index) {
                        if (index < fwd_count) {
                            out.push(x);
                            bytes += x.length;
                            if (index === fwd_count - 1) {
    
                                if (bytes >= fwd_len) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    })) {
                        // we have enough data....
                        const leading_data = out.join('').substr(0, fwd_len);
    
                        slices.forwards[
                        fwd_count - 1].needHash(function(fwd_hash) {
    
                            if (fwd_hash !== trailing_fwd_hash) {
    
                                return cb(new Error("trailing forward hash check fails"));
    
                            }
    
                            out.splice(0, out.length);
                            bytes = 0;
                            if (slices.backwards.some(function(x, index) {
                                if (index < back_count) {
                                    out.unshift(x);
                                    bytes += x.length;
                                    if (index === back_count - 1) {
                                        if (bytes >= back_len) {
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            })) {
                                const trailing_data = out.join('').substr(0 - back_len);
                                out.splice(0, out.length);
    
    
    
    
                                slices.backwards[
                                back_count - 1].needHash(function(back_hash) {
    
                                    if (leading_back_hash !== back_hash) {
                                        return cb(new Error("leading backward hash check fails"));
                                    }
    
                                    if (skipFinalHash) {
                                        return cb(undefined, leading_data, trailing_data);
                                    }
    
                                    const candidate_data = leading_data + trailing_data;
    
    
                                    sha1(candidate_data, function(test_hash) {
    
                                        if (test_hash !== updating_hash) {
                                            return cb(new Error("final hash check fails"));
                                        }
    
                                        return cb(undefined, candidate_data);
                                    });
    
                                });
    
    
    
                            } else return cb(new Error("insufficient backward hashing blocks"));
    
                        });
    
    
                    } else {
    
    
    
                        return cb(new Error("insufficient forward hashing blocks"));
                    }
    
    
    
                }
    
                function parse_DATA_BACKWARDS(msg) {
                    /*msg.push(
                    3   DATA_BACKWARDS,
    
                    4   matching_backwards.length,
                    5   back_len,
                    6   leading_back_hash
                    
                    7   data_hash,
                    8   data
                     
                     */
    
    
                    if (msg.length !== 9) {
    
                        return callback(new Error("sanity check fails: msg.length should be 9"));
                    }
    
                    const
    
                    updating_hash = msg[1],
                    updating_length = msg[2],
    
                    back_count = msg[4],
                    back_len = msg[5],
                    leading_back_hash = msg[6],
    
                    data_hash = msg[7],
                    data = msg[8],
    
    
                    out = [];
    
                    sha1(data, function(test_hash) {
    
                        if (test_hash !== data_hash) {
                            return callback(new Error("embeded data hash check fails"));
                        }
    
    
                        if (data.length + back_len !== updating_length) {
    
                            return callback(new Error("sanity check fails: data.length+back_len != length"));
                        }
    
    
    
                        var bytes = 0;
                        if (slices.backwards.some(function(x, index) {
                            if (index < back_count) {
                                out.unshift(x);
                                bytes += x.length;
                                if (index === back_count - 1) {
                                    if (bytes >= back_len) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        })) {
                            const trailing_data = out.join('').substr(0 - back_len);
                            out.splice(0, out.length);
    
    
    
    
                            slices.backwards[
                            back_count - 1].needHash(function(back_hash) {
    
                                if (leading_back_hash !== back_hash) {
                                    return callback(new Error("leading backward hash check fails"));
                                }
    
    
    
                                const candidate_data = data + trailing_data;
    
    
                                sha1(candidate_data, function(test_hash) {
    
                                    if (test_hash !== updating_hash) {
                                        return callback(new Error("final hash check fails"));
                                    }
    
                                    return callback(undefined, candidate_data);
                                });
    
                            });
    
    
    
                        }
    
    
                    });
    
    
                }
    
                function parse_FORWARDS_DATA(msg) {
                    /*msg.push(
                    3   DATA_BACKWARDS,
    
                    4   matching_forwards.length,
                    5   fwd_len,
                    6   trailing_fwd_hash,
    
                    
                    7   data_hash,
                    8   data
                     
                     */
    
    
                    if (msg.length !== 9) {
    
                        return callback(new Error("sanity check fails: msg.length should be 9"));
                    }
    
                    const
    
                    updating_hash = msg[1],
                    updating_length = msg[2],
    
                    fwd_count = msg[4],
                    fwd_len = msg[5],
                    trailing_fwd_hash = msg[6],
    
                    data_hash = msg[7],
                    data = msg[8],
    
    
                    out = [];
    
                    sha1(data, function(test_hash) {
    
                        if (test_hash !== data_hash) {
                            return callback(new Error("embeded data hash check fails"));
                        }
    
    
                        if (fwd_len + data.length !== updating_length) {
    
                            return callback(new Error("sanity check fails: fwd_len+data.length != length"));
                        }
    
    
    
                        var bytes = 0;
    
                        if (slices.forwards.some(function(x, index) {
                            if (index < fwd_count) {
                                out.push(x);
                                bytes += x.length;
                                if (index === fwd_count - 1) {
    
                                    if (bytes >= fwd_len) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        })) {
    
    
                            // we have enough data....
                            const leading_data = out.join('').substr(0, fwd_len);
                            out.splice(0, out.length);
    
    
    
    
                            slices.forwards[
                            fwd_count - 1].needHash(function(fwd_hash) {
    
                                if (fwd_hash !== trailing_fwd_hash) {
    
                                    return callback(new Error("trailing forward hash check fails"));
    
                                }
    
    
    
    
                                const candidate_data = leading_data + data;
    
    
                                sha1(candidate_data, function(test_hash) {
    
                                    if (test_hash !== updating_hash) {
                                        return callback(new Error("final hash check fails"));
                                    }
    
                                    return callback(undefined, candidate_data);
                                });
    
                            });
    
    
    
                        }
    
    
                    });
    
    
                }
    
                function parse_FORWARDS(msg) {
                    /*msg.push(
                    3   FORWARDS,
    
                    4   matching_forwards.length,
                    5   fwd_len,
                    6   trailing_fwd_hash,
    
                     */
    
    
                    if (msg.length !== 7) {
    
                        return callback(new Error("sanity check fails: msg.length should be 7"));
                    }
    
                    const
    
                    updating_hash = msg[1],
                    updating_length = msg[2],
    
                    fwd_count = msg[4],
                    fwd_len = msg[5],
                    trailing_fwd_hash = msg[6],
    
                    out = [];
    
    
    
                    if (fwd_len !== updating_length) {
    
                        return callback(new Error("sanity check fails: fwd_len !== updating_length"));
                    }
    
    
    
                    var bytes = 0;
    
                    if (slices.forwards.some(function(x, index) {
                        if (index < fwd_count) {
                            out.push(x);
                            bytes += x.length;
                            if (index === fwd_count - 1) {
    
                                if (bytes >= fwd_len) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    })) {
    
    
                        // we have enough data....
                        const leading_data = out.join('').substr(0, fwd_len);
                        out.splice(0, out.length);
    
    
    
    
                        slices.forwards[
                        fwd_count - 1].needHash(function(fwd_hash) {
    
                            if (fwd_hash !== trailing_fwd_hash) {
    
                                return callback(new Error("trailing forward hash check fails"));
    
                            }
    
                            if (bytes === fwd_len && trailing_fwd_hash == updating_hash) {
    
                                return callback(undefined, leading_data);
                            }
    
    
                            sha1(leading_data, function(test_hash) {
    
                                if (test_hash !== updating_hash) {
                                    return callback(new Error("final hash check fails"));
                                }
    
                                return callback(undefined, leading_data);
                            });
    
                        });
    
    
    
                    }
    
    
                }
    
                function parse_BACKWARDS(msg) {
                    /*msg.push(
                     3   BACKWARDS,
     
                     4   matching_backwards.length,
                     5   back_len,
                     6   leading_back_hash
                     
     
                      */
    
    
                    if (msg.length !== 7) {
    
                        return callback(new Error("sanity check fails: msg.length should be 7"));
                    }
    
                    const
    
                    updating_hash = msg[1],
                    updating_length = msg[2],
    
                    back_count = msg[4],
                    back_len = msg[5],
                    leading_back_hash = msg[6],
    
                    out = [];
    
    
    
                    if (back_len !== updating_length) {
    
                        return callback(new Error("sanity check fails: back_len !== updating_length"));
                    }
    
    
    
                    var bytes = 0;
                    if (slices.backwards.some(function(x, index) {
                        if (index < back_count) {
                            out.unshift(x);
                            bytes += x.length;
                            if (index === back_count - 1) {
                                if (bytes >= back_len) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    })) {
                        const trailing_data = out.join('').substr(0 - back_len);
                        out.splice(0, out.length);
    
    
    
                        slices.backwards[
                        back_count - 1].needHash(function(back_hash) {
    
                            if (leading_back_hash !== back_hash) {
                                return callback(new Error("leading backward hash check fails"));
                            }
    
                            if (bytes === back_len && leading_back_hash == updating_hash) {
    
                                return callback(undefined, trailing_data);
                            }
    
    
                            sha1(trailing_data, function(test_hash) {
    
                                if (test_hash !== updating_hash) {
                                    return callback(new Error("final hash check fails"));
                                }
    
                                return callback(undefined, trailing_data);
                            });
    
                        });
    
    
    
                    }
    
    
                }
    
                function parse_DATA(msg) {
                    /*msg.push(
                    3   DATA,
               
                     */
    
    
                    if (msg.length !== 4) {
    
                        return callback(new Error("sanity check fails: msg.length should be 4"));
                    }
    
                    const
    
                    updating_hash = msg[1],
                    updating_length = msg[2],
                    data = msg[3];
    
                    if (data.length !== updating_length) {
    
                        return callback(new Error("sanity check fails: data.length != length"));
                    }
    
    
                    sha1(data, function(test_hash) {
    
                        if (test_hash !== updating_hash) {
                            return callback(new Error("embeded data hash check fails"));
                        }
    
                        return callback(undefined, data);
                    });
    
    
                }
            },
    
            collect_updates = function(updating, updating_length, updating_hash) {
    
                collectSlices(
                sha1, undefined,
                updating, updating_length, 0, chunksize, false,key,  function(update_slices) {
    
                    const updateScript = [
                    /*from*/
                    hash,
                    /*to*/
                    updating_hash,
                    /*new length*/
                    updating_length];
    
                    const call_updater = function(evnt) {
                        parse_update(updateScript,function (err,test_data){
                            if (err) {
                                log(err.message);
                                return;
                            }
                            if (test_data!==value) {
                                log("test parse failed");
                                return;
                            }
                            value  = updating;
                            length = updating_length;
                            hash   = updating_hash;
                            slices.forwards.splice.apply(
                            slices.forwards, [
                            0, slices.forwards.length].concat(update_slices.forwards));
                            
                            slices.backwards.splice.apply(
                            slices.backwards, [
                            0, slices.backwards.length].concat(update_slices.backwards));
                            
                            return self.emit(evnt,updateScript);
                        });
                    };
    
                    if (full_update_needed) {
    
                        full_update_needed = false;
                        updateScript.push(
                        DATA,
                        updating);
    
                        return call_updater('fullpatch');
    
                    }
    
    
    
    
                    let ok = true, fwd_len = 0, back_len = 0;
                    const matching_forwards = slices.forwards.filter(function(fwd, index) {
                        if (ok) {
                            if (fwd.compare(update_slices.forwards[index]) === true) {
                                fwd_len += fwd.length;
                                return true;
                            }
                            ok = false;
                        }
                        return false;
                    });
    
    
                    ok = true;
                    const matching_backwards = slices.backwards.filter(function(back, index) {
                        if (ok) {
                            if (back.compare(update_slices.backwards[index]) === true) {
                                back_len += back.length;
                                return true;
                            }
                            ok = false;
                        }
                        return false;
                    });
    
                    if (fwd_len > 0 && back_len > 0) {
                        // there is mathcing data at both ends of the file versions
    
                        if (fwd_len + back_len > updating_length) {
                            //  overlaps - eg user deleted an area larger than one chunk
                            //eg   [fwd0,fwd1,fwd2] 
                            //                 [ back2,back1,back0]
    
    
                            let dropped;
    
                            // drop overlapping blocks from the center until we have a gap
                            while (fwd_len + back_len > updating_length) {
    
                                if (matching_forwards.length === 1) {
                                    // makes more sense to convert it to
                                    // [???] [ back2,back1,back0]
    
                                    fwd_len -= (dropped = matching_forwards.pop()).length;
                                } else {
                                    if (matching_backwards.length === 1) {
                                        // makes more sense to convert it to
                                        // [fwd0,fwd1,fwd2]  [???]  
                                        back_len -= (dropped = matching_backwards.pop()).length;
                                    } else {
    
    
                                        if (matching_forwards.length === 0 && matching_backwards.length > 0) {
    
                                            back_len -= (dropped = matching_backwards.pop()).length;
    
                                        } else {
                                            if (matching_backwards.length === 0 && matching_forwards.length > 0) {
    
                                                fwd_len -= (dropped = matching_forwards.pop()).length;
    
                                            } else {
    
                                                if (fwd_len > back_len) {
                                                    fwd_len -= (dropped = matching_forwards.pop()).length;
                                                } else {
                                                    back_len -= (dropped = matching_backwards.pop()).length;
    
                                                }
    
                                            }
                                        }
    
                                    }
                                }
    
    
    
                            }
    
    
                            // and unless it's an exact block boundary, push the most recently dropped 
                            // block back into it's stack
                            // (this way we know there is only 1 block overlap)
                            if (dropped) {
    
                                if ((fwd_len + back_len) < updating_length /*boundary check*/ ) {
                                    if (dropped.type === "forwards") {
                                        matching_forwards.push(dropped);
                                    } else {
                                        matching_backwards.push(dropped);
                                    }
                                }
    
                                if (matching_forwards.length > 0) {
                                    // truncate the overlap at the end of the forwards list
                                    fwd_len = updating_length - back_len;
                                    //eg   [fwd0,fwd1,fwd2]
                                    //                [ back2,back1,back0]
                                    if (matching_backwards.length > 0) {
    
    
                                        return matching_forwards[
                                        matching_forwards.length - 1].needHash(function(trailing_fwd_hash) {
    
    
                                            matching_backwards[
                                            matching_backwards.length - 1].needHash(function(leading_back_hash) {
    
                                                updateScript.push(
                                                FORWARDS_BACKWARDS,
    
    
                                                matching_forwards.length,
                                                fwd_len,
                                                trailing_fwd_hash,
    
                                                matching_backwards.length,
                                                back_len,
                                                leading_back_hash
    
    
                                                );
    
    
                                                return call_updater('changepatch');
    
    
                                            });
                                        });
    
                                    } else {
    
                                        return matching_forwards[
                                        matching_forwards.length - 1].needHash(function(trailing_fwd_hash) {
    
                                            updateScript.push(
                                            FORWARDS,
                                            matching_forwards.length,
                                            fwd_len,
                                            trailing_fwd_hash);
    
                                            return call_updater('changepatch');
    
                                        });
    
                                    }
    
    
    
    
    
                                } else {
                                    back_len = updating_length - fwd_len;
    
                                    return matching_backwards[
                                    matching_backwards.length - 1].needHash(function(leading_back_hash) {
    
                                        updateScript.push(
    
                                        BACKWARDS,
                                        matching_backwards.length,
                                        back_len,
                                        leading_back_hash);
    
                                        return call_updater('changepatch');
    
                                    });
                                }
    
    
                            }
    
    
                        }
                    }
    
                    // check the condition again, as it might have changed inside the loop
                    if (fwd_len > 0 && back_len > 0) {
    
                        if (fwd_len + back_len < updating_length) {
                            // editing the middle of the file - most commmon scenario
                            //eg   [fwd0,fwd1,fwd2] [???] [ back2,back1,back0]
    
    
                            const
    
                            data_len = updating_length - (fwd_len + back_len),
                            data = updating.substr(fwd_len, data_len);
    
                            return matching_forwards[
                            matching_forwards.length - 1].needHash(function(trailing_fwd_hash) {
    
    
                                matching_backwards[
                                matching_backwards.length - 1].needHash(function(leading_back_hash) {
    
    
                                    sha1(data, function(data_hash) {
    
                                        updateScript.push(
    
                                        FORWARDS_DATA_BACKWARDS,
    
                                        matching_forwards.length,
                                        fwd_len,
                                        trailing_fwd_hash,
    
                                        matching_backwards.length,
                                        back_len,
                                        leading_back_hash,
    
                                        data_hash,
                                        data);
    
                                        return call_updater('changepatch');
                                    });
    
                                });
                            });
    
    
                        }
    
                    }
    
    
    
    
    
    
                    if ((fwd_len > 0) && (back_len === 0)) {
                        //editing near end of file
                        //eg   [fwd0,fwd1,fwd2] [????]
    
                        const
                        
                        data_len = updating_length - fwd_len,
                        data = updating.substr(fwd_len, data_len);
    
    
                        return matching_forwards[
                        matching_forwards.length - 1].needHash(function(trailing_fwd_hash) {
    
    
                            sha1(data, function(data_hash) {
    
    
    
                                updateScript.push(
    
                                FORWARDS_DATA,
    
                                matching_forwards.length,
                                fwd_len,
                                trailing_fwd_hash,
    
                                data_hash,
                                data
    
                                );
    
                                return call_updater('changepatch');
    
                            });
    
                        });
    
    
    
                    } else {
                        if ((back_len > 0) && (fwd_len === 0)) {
                            // editing near start of file
                            //   [???]  [ back2,back1,back0]
    
                            const
    
                            data_len = updating_length - back_len,
                            data = updating.substr(0, data_len);
     
                             return   matching_backwards[
                                matching_backwards.length - 1].needHash(function(leading_back_hash) {
    
    
                                    sha1(data, function(data_hash) {
    
    
                                        updateScript.push(
    
                                        DATA_BACKWARDS,
    
                                        matching_backwards.length,
                                        back_len,
                                        leading_back_hash,
    
                                        data_hash,
                                        data
    
    
                                        );
    
                                        return call_updater('changepatch');
    
                                    });
    
                                });
                       
    
                        } else {
                            // absolutely nothing matches.
                            // eg pasted something else over the whole file.
    
                            updateScript.push(
                            DATA,
                            updating);
    
                            call_updater('fullpatch');
                        }
    
                    }
    
    
    
                });
    
            },
    
            collect = function() {
                collectSlices(sha1, slices, value, length, 0, chunksize, true,key , function() {
                    onUpdate = function() {
                        if (first_update) {
                            clearTimeout(first_update);
                            first_update = undefined;
                        }
                        if (newValue) {
    
                            if (newValue === value) {
                                // nothing to do here.
                                if (full_update_needed) {
                                    full_update_needed = false;
                                    self.emit('fullpatch',[
                                    
                                    /*from*/
                                    hash,
                                    /*to*/
                                    hash,
                                    /*new length*/
                                    value.length,
                                    
                                    DATA,
                                    
                                    value]);
                                    
                                }
                                newValue = undefined;
                                return;
                            }
    
                            const updating = newValue;
                            newValue = undefined;
    
    
                            sha1(updating, function(newHash) {
                                if (updating.length < chunksize) {
                                    const one_chunk = [{
                                        offset: 0,
                                        value: updating,
                                        length: updating.length,
                                        hash: newHash
                                    }];
                                    nuke(slices.forwards, one_chunk);
                                    nuke(slices.backwards, one_chunk);
                                    value = updating;
                                    const oldHash = hash;
                                    hash = newHash;
                                    self.emit('fullpatch',[
                                        
                                        /*from*/
                                        oldHash,
                                        /*to*/
                                        newHash,
                                        /*new length*/
                                        value.length,
                                        
                                        DATA,
                                        
                                        value]);
                                } else {
                                    collect_updates(updating, updating.length, newHash);
    
                                }
                            });
    
    
                        }
                    };
                    if (newValue && newValue !== value) {
                        onUpdate();
                    } else {
                        newValue = undefined;
                        full_update_needed = false;
                        self.emit('fullpatch',[
                        
                        /*from*/
                        hash,
                        /*to*/
                        hash,
                        /*new length*/
                        value.length,
                        
                        DATA,
                        
                        value]);
                    }
                });
            };
    
    
    
        sha1(value, function(h) {
            hash = h;
            if (length < chunksize) {
                const one_chunk = [{
                    offset: 0,
                    value: value,
                    length: length.length,
                    hash: hash
                }];
                slices.forwards.push(one_chunk);
                slices.backwards.push(one_chunk);
            } else {
                collect();
            }
    
        });
    
        var events = {
           change      : [],
           changepatch : [],
           fullpatch   : [],   
        };
        
        Object.defineProperties(self, {
            value: {
                get: function() {
                    return value;
                },
                set: function(v) {
                    newValue = v;
                    onUpdate();
                },
                enumerable: true
            },
            
            hash : {
                
              get : function (){
                  
                  return hash;
              }  
                
            },
            
            addEventListener :{
                
                value : function (ev,fn) {
                    const evs = events[ev];
                    if (typeof fn==='function'&&Array.isArray(evs)) {
                        evs.push(fn);
                    }
                },
                enumerable:false
            },
            removeEventListener: {
                
                value : function (ev,fn) {
                    const evs = events[ev];
                    if (typeof fn==='function'&&Array.isArray(evs)) {
                        const ix = evs.indexOf(fn);
                        if (ix< 0) return;
                        evs.splice(ix,1);
                    }
                },
                enumerable:false
                
            },    
            emit : {
                
                value : function (ev,msg) {
                    const evs = events[ev];
                    if (typeof msg==='object'&&Array.isArray(evs)) {
                        evs.some(function(fn){fn(msg);});
                    }
                },
                enumerable:false
            },
            
            patch : {
              value : function (msg,cb) {  
                  parse_update (msg,function(err,new_value){
                      if (new_value && !err) {
                        value=new_value;
                        self.emit('change',new_value);
                        return cb ?  cb(undefined,new_value): logReturn("patch applied");
                      } else {
                       
                        return cb?cb(err) : logReturn(err);
                      }
                  });
              },
            },

            close: {
    
                value: function() {
                   events.change.splice(0,events.change.length);
                   events.changepatch.splice(0,events.changepatch.length);
                   events.fullpatch.splice(0,events.fullpatch.length);
                   delete events.change;
                   delete events.changepatch;
                   delete events.fullpatch;
                   
                   nuke (slices.forwards);
                   nuke (slices.backwards);
                   delete slices.forwards;
                   delete slices.backwards;
                    
                   
                },
                enumerable: false
                
            }

        });

        return self;
    
    }
    
    function ajaxMiddleWare(ajax,base_URL,username,password) {
        
        var cache = {};
        
        checkCached();
        
        logging(beforeAjaxHead,true);
        logging(beforeAjaxGet,true);
        logging(afterAjaxGet,true);
        logging(onAjaxGetError,true);
        
        logging(beforeAjaxPut,true);
        logging(afterAjaxPut,true);
        logging(onAjaxPutError,true);
        
        logging(beforeAjaxPost,true);
        logging(afterAjaxPost,true);
        logging(onAjaxPostError,true);
        
        logging(ajaxHandler,false);
        
                
    
        return ajaxHandler;
        
        function getFromCache(uri_id, defaultValue, cb) {
            const cacheObj = cache[uri_id]; 
            if (cacheObj) {
                cacheObj.touched = Date.now();
                return cb (cacheObj.data,cacheObj);
            }
            return cb(defaultValue);
        } 
        
        function updateCache(url, uri_id, value, cb) {
           const cacheObj = cache[uri_id]; 
           const NOW=Date.now();
           if (cacheObj) {
               cacheObj.touched = NOW;
               cacheObj.changed = NOW;
               cacheObj.data    = value;
               return cb (cacheObj);
           } else {
               const newCacheObj = cache[uri_id] = {
                  touched : NOW,
                  changed : NOW,
                  data    : value,
                  url     : url
               };
               return cb (newCacheObj);
           }         
        }
        
        function checkCached() {
            
            const earliest = Date.now() -1000 *  60 * 60 * 2;
            Object.keys(cache).forEach(function(uri_id){
                const cacheObj = cache[uri_id]; 
                if (!cacheObj.touched || cacheObj.touched < earliest ){
                    delete cache[uri_id]; 
                }
            });
            setTimeout(checkCached,60*1000*3);
            
        } 
        
        function ajaxPatchTemplate(url, msg, success, error) {
            
            const t = {
                url:URL,
                type:'PATCH',
                contentType: "application/json",
                data     : msg,
                dataType : "json",
                headers  : upgrade_headers,
                success  : success,
                error    : error
            };
            
            if (username&&password) {
              t.username = username;
              t.password = password;
            }
            
            return t;
        }

        function on_updated (uri_id, url, cacheObj, msg) {
            updateCache(url, uri_id,msg[3],function(cacheObj){
                ajax (
                    ajaxPatchTemplate(
                        url,msg,
                        function success (response,status,xhr) {
                            
                        },
                        function error (xhr) {
                            
                        }
                    )
                );
            });
        }
        function on_changed (uri_id, url, cacheObj, msg) {
            ajax (
                ajaxPatchTemplate(
                    url,msg,
                    function success (response,status,xhr) {
                        
                    },
                    function error (xhr) {
                        
                    }
                )
            );
        }
        
        
        
        function ajaxHandler(AJAX, JQ, ARGS, ON) {
            const log = ajaxHandler.log;
            
            log("ajaxHandler:",ARGS);
            
            // handler for all requests that are local ("ON.URI") 
            ON.URL(base_URL,function(){
                
                
                
                ON.before_HEAD(beforeAjaxHead);
                
                ON.before_GET(beforeAjaxGet);
                ON.after_GET(afterAjaxGet);
                ON.error_GET(onAjaxGetError);
                
                ON.before_PUT(beforeAjaxPut);
                ON.after_PUT(afterAjaxPut);
                ON.error_PUT(onAjaxPutError);
        
    
                ON.beforePOST(beforeAjaxPost);
                ON.after_POST(afterAjaxPost);
                ON.error_POST(onAjaxPostError);
               
            });

                
        }
        

        function beforeAjaxHead(url, uri_id, allow, deny, respond, OPTS) {
            const log = beforeAjaxHead.log;
            //getFromCache(uri_id,null,function(file,cacheObj){
                if (OPTS.headers) {
                   OPTS.headers[upgrade_header_name]=upgrade_header_value;
                } else {
                   OPTS.headers =upgrade_headers; 
                }
               return allow();
           // });
        }
        
        function beforeAjaxGet(url, uri_id, allow, deny, respond, OPTS) {
            const log = beforeAjaxGet.log;
            getFromCache(uri_id,null,function(file,cacheObj){
                if (file===null) {
                    if (OPTS.headers) {
                       OPTS.headers[upgrade_header_name]=upgrade_header_value;
                    } else {
                       OPTS.headers =upgrade_headers; 
                    }
                   return allow();
                }
               

                if (!cacheObj.handle) {
                    cacheObj.handle = openDiffer(cacheObj,uri_id);
                    cacheObj.handle.addEventListener('fullpatch',on_updated.bind(this,uri_id,url,cacheObj));
                    cacheObj.handle.addEventListener('changepatch',on_changed.bind(this,uri_id,url,cacheObj));
                } 
                return respond(200,file);
            });
        }
        function afterAjaxGet(url, uri_id, response, deny, respond) {
            const log = afterAjaxGet.log;
            updateCache(url, uri_id,response,function(cacheObj){
               if (!cacheObj.handle) {
                   cacheObj.handle = openDiffer(cacheObj,uri_id);
                   cacheObj.handle.addEventListener('fullpatch',on_updated.bind(this,uri_id,url,cacheObj));
                   cacheObj.handle.addEventListener('changepatch',on_changed.bind(this,uri_id,url,cacheObj));
               } 
               respond(response);
           });
        }
        function onAjaxGetError(uri, url_id, status, deny, respond) {
            const log = onAjaxGetError.log;
            log(uri,status);
            deny(status);
        }
        
        function beforeAjaxPut(url, uri_id, allow, deny, respond, OPTS) {
             const log = beforeAjaxPut.log;
             updateCache(url,uri_id,OPTS.data,function(){
                if (OPTS.headers) {
                   OPTS.headers[upgrade_header_name]=upgrade_header_value;
                } else {
                   OPTS.headers =upgrade_headers; 
                }                 
                allow();
             });
        }
        function afterAjaxPut(uri, uri_id, response, deny, respond) {
            const log = afterAjaxPut.log;
            log(uri,response);// inspect results
            respond(response);
        }
        function onAjaxPutError(uri, url_id, status, deny, respond) {
            const log = onAjaxPutError.log;
            log(uri,status);
            deny(status);
        }
        
        function beforeAjaxPost(uri, url_id, allow, deny, respond, OPTS) {
            const log = beforeAjaxPost.log;
            log(uri);
            allow();
        }
        function afterAjaxPost(uri, url_id, response, deny, respond) {
            const log = afterAjaxPost.log;
            log(response);// inspect results
            response.seen = true;//modify results
            respond(response);
        }
        function onAjaxPostError(uri, url_id, status, deny, respond) {
            const log = onAjaxPostError.log;
            log(status);// inspect results
            if (status===500) {
                respond('<html><body>sorry.</body></html>');
            } else {
                deny(status);
            }
        }
        
    }
    
    
    function sha1Lib() {
        return sha1Lib.lib || (function(x) {
            
            return  (sha1Lib.lib = (/*node>>>*/x === 'objectundefined' ? sha1Node : /*<<<node*/  sha1Browser)() );
            
        })(typeof process + typeof window);
    
        function sha1SubtleBrowser() {
            return function sha1(str, cb) {
                if (typeof cb === 'function') return sha1BrowserPromise(str).then(cb);
            };
    
            function sha1BrowserPromise(str) {
                return window.crypto.subtle.digest(
                    "SHA-1",
                new TextEncoder("utf-8").encode(str))
                    .then(function(hash) {
                    return hexBrowser(hash);
                });
            }
    
            function hexBrowser(buffer) {
                var hexCodes = [];
                var view = new DataView(buffer);
                for (var i = 0; i < view.byteLength; i += 4) {
                    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
                    var value = view.getUint32(i);
                    // toString(16) will give the hex representation of the number without padding
                    var stringValue = value.toString(16);
                    // We use concatenation and slice for padding
                    var padding = '00000000';
                    var paddedValue = (padding + stringValue).slice(-padding.length);
                    hexCodes.push(paddedValue);
                }
                // Join all the hex strings into one
                return hexCodes.join("");
            }
        }
    
        function sha1Browser() {
    
            return window.crypto && window.crypto.subtle && window.crypto.subtle.digest ? sha1SubtleBrowser() : sha1Wrap;
    
            function sha1Wrap(str, cb) {
                var hex = window.sha1(str);
                return (typeof cb === 'function') ? cb(hex) : hex;
            }
        }
    /*node>>>*/
        function sha1Node() {
            var crypto = require('crypto');
            return function sha1(str, cb) {
                var shasum = crypto.createHash('sha1');
                shasum.update(str);
                var hex = shasum.digest('hex');
                return typeof cb === 'function' ? setImmediate(cb, hex) : hex;
            };
        }
    /*<<<node*/ 
    }
    
    
    define(function() {
        exports.sha1 = sha1;
        exports.forwardSubstring = forwardSubstring;
        exports.reverseSubstring = reverseSubstring;
        exports.collectSlices    = collectSlices;
        exports.openDiffer       = openDiffer;
        exports.ajaxMiddleWare   = ajaxMiddleWare;
        
        
        exports.upgrade_header_name = upgrade_header_name;
        exports.upgrade_header_value = upgrade_header_value;
        exports.upgrade_headers = upgrade_headers;
        
        return exports;
    });        
    

/*node>>>*/


    if (isNodeJS) {
        (function(){            
                    const fs = require('fs'),
                    crypto = require("crypto"),
                    pathlib = require("path"),
                    urllib = require("url"),
                    mime = require("mime"),
                    
                    {
                            fs_make_path_for_sync,
                            fs_writeFileSync,
                            fs_make_path_for,
                            fs_writeFile,
                            fs_statSync,
                            fs_stat,
                            fs_atmomicReplace
                            
                    } = require('./fs-tools.js'),
                        
                        
                    {
                        objectFunctionShim,
                        bufferBodyRequest,
                        proxyRequestBody,
                        proxyResponseWrite
                        
                    } = require ("./req-res-proxies.js");


                    // no point in exporting the web browser middlware code...
                    delete exports.ajaxMiddleWare;
                    exports.selfServeHandler = require('./self-serve-handler.js')(__filename,undefined,strip_browser_logging);
                    exports.nodeMiddleware = nodeMiddleware;
   

             logging(nodeMiddleware,true);
             
             function nodeMiddleware(
                 app,express,
                 realHeadHandler,
                 realGetHandler,
                 realPutHandler,
                 realDeleteHandler) {
                      
                 const log = nodeMiddleware.log;     
                
                 const cache = {};
                
                 return nodeRequestHandler;
          
                 function nodeRequestHandler (req,res,next) {
                    // filter out improper requests.
                    if (req && res){
                        next=next||noNext;
                        switch (req.method) {
                            case "HEAD" :    return nodeHeadHandler(req,res);
                            case "PATCH" :   return nodePatchHandler(req,res);
                            case "GET" :     return nodeGetHandler(req,res);
                            case "PUT" :     return nodePutHandler(req,res);
                            case "DELETE" :  return nodeDeleteHandler(req,res);
                                
                            default:        return next();
                        } 
                        
                        if (req.method!=="PATCH") {
                           return next();

                        } 
                    } else return;
                    
                    function noNext () {
                        res.writeHead(500, {
                            "Content-Type": "text/plain"
                        });
                        req.connection.destroy();
                    }
   
                    
                    
                 }
                 
                 function getURLId(uri,cb) {
                     sha1(uri,function(uri_id){
                         return cb(uri,uri_id);
                     });
                 }
                 
                 
                 function nodeHeadHandler (req,res) {
                    
                   
                    /*
                    traps data that's sent via the standard GET method, and caches it, in 
                    anticipation of pending PATCH methods.
                    
                    */ 
                    
                    log("nodeHeadHandler",req.url);
                    
                    // first get a cache id for the request
                    getURLId(req.url,function(uri,uri_id){
                        log("nodeHeadHandler->getURLId",uri_id);
                         //pass the request on to the real handler.
                        realHeadHandler(req,res);
                        
                    });
                    
                 }
                 

                 function nodeGetHandler (req,res) {
                    /*
                    traps data that's sent via the standard GET method, and caches it, in 
                    anticipation of pending PATCH methods.
                    
                    */ 
                    
                    log("nodeGetHandler",req.url);
                    
                    // first get a cache id for the request
                    getURLId(req.url,function(uri,uri_id){
                        log("nodeGetHandler->getURLId",uri_id);
                        //trap the buffer being sent to this response...
                        proxyResponseWrite(res).onBuffer=function(buffer){
                            log("nodeGetHandler->proxyResponseWrite->",typeof buffer);
                            
                            const meta = cache[uri_id] || ( cache[uri_id] = {uri:uri} );   
                            if (meta.handle) {
                                meta.handle.close();
                            }
                            
                            log("proxied GET:updating cache:#"+uri_id,uri,buffer.length,"bytes");
                            meta.handle = openDiffer(buffer.toString('utf8'));
                            
                        };
                        
                        //pass the request on to the real handler.
                        realGetHandler(req,res);
                        
                    });
                    
                 }
         
         
                 function nodePutHandler (req,res) {
                     
                     /*
                         traps data that's received via the standard PUT method, and caches it, in 
                         anticipation of pending PATCH methods.
                     
                     */ 
                     
                     
                    getURLId(req.url,function(uri,uri_id){
                        
                        const REQ = proxyRequestBody(req);
                        
                        REQ.on('__end',function(chunk,chunks){
                            
                             const
                             
                             meta = cache[uri_id] || (  cache[uri_id] = { uri:uri }  );
                         
                             if (meta.handle) {
                               meta.handle.close();
                             }
                             const buffer = Buffer.concat(chunks);
                             log("proxied PUT:updating cache:#"+uri_id,uri,buffer.length,"bytes");
                             meta.handle = openDiffer(buffer.toString('utf8'));
                             

                        });
                        
                        realPutHandler(REQ,res);
                       
                       
                    });
                    
                 } 
                 
                 
                 function nodeDeleteHandler (req,res) {
                     
                     /*
                         traps data that's received via the standard PUT method, and caches it, in 
                         anticipation of pending PATCH methods.
                     
                     */ 

                     getURLId(req.url,function(uri,uri_id){
                        
                        const meta = cache[uri_id]  ;
                        if (meta) {
                    
                            if (meta.handle) {
                              meta.handle.close();
                            }
                            delete meta.handle;
                            delete meta.data;
                            delete cache[uri_id];
                            
                        }
                        realDeleteHandler(req,res);
                       
                       
                    });
                    
                 } 
                 
                 
                 function nodePatchHandler (req,res) {
                     
                     bufferBodyRequest(req,res,"patch",function(){
                         
                         // first get a cache id for the request
                         getURLId(req.url,function(uri,uri_id){
                             
                             const meta = cache[uri_id];
                             
                             if (meta.handle) {
                                 
                               meta.handle.patch(req.patch,function(err,newTextData){
                                   
                                   if (err) {
                                       res.writeHead(200, "OK", {
                                           'Content-Type': 'application/json'
                                       });
                                       res.end(JSON.stringify(
                                           {error:err.message||err,current:meta.handle.hash}
                                       ));
                                       
                                   } else {
                                        
                                           
                                         // make a fake request object that can be used in PUT handler
                                         const 
                                          //dataBuf = Buffer.from(newTextData,'utf8'), 
                                          REQ = proxyRequestBody(
                                             req.url,
                                             [
                                                 //dataBuf
                                                 newTextData   // we can get away with this, because zedd just doesn't inspect it.
                                                        // just passes it on to file.write.
                                             ],
                                             {
                                               method:'PUT'
                                               //headers : {  'content-length' : dataBuf.length.toString()  }
     
                                             });
                                       
                                         
                                         proxyResponseWrite(res).onChunks=function(chunks){
                                             
                                             // this gets invoked after the data has been read from the request body
                                             
                                             // we don't really want the chunks, but we need to know it's done.
                                             // as it turns out this is fine for memory usage as we will get the same
                                             // exact data we passed into REQ, so no big deal.
                                             
                                             meta.data = newTextData;
                                             
                                             res.writeHead(200, "OK", {
                                                 'Content-Type': 'application/json'
                                             });
                                             res.end(JSON.stringify(
                                                 {current:meta.handle.hash}
                                             ));
                                         
                                                 
     
                                         };
                                         
                                         realPutHandler(REQ,res);
                                   }
                               });
                               
                             }
                     
                            
                         
                         });
                         
                         
                     });
                    
                 }
               
              
             
           }
           


            })();
    }
    
/*<<<node*/ 


    

})( /*exports*/       /*node>>>*/ isNodeJS ? module.exports :/*<<<node*/  (window.stringDiffRegex={}),
    /*define*/        /*node>>>*/ isNodeJS ? no_define     :/*<<<node*/    (typeof define==='function'?define:no_define)
);

    function no_define(fn){
         fn();
    }

}
)(/*node>>>*/typeof process==='object' && typeof module==='object'/*<<<node*/ );     