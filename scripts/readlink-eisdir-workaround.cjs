/**
 * Workaround for Windows environments where fs.readlink can throw EISDIR
 * for regular files. Webpack expects non-symlink errors like EINVAL/UNKNOWN.
 */

const fs = require('fs')

const originalReadlink = fs.readlink
const originalReadlinkSync = fs.readlinkSync
const originalPromisesReadlink = fs.promises?.readlink

function asInvalidSymlinkError(error) {
  if (!error || error.code !== 'EISDIR') return error
  const patched = new Error(error.message)
  patched.code = 'EINVAL'
  patched.errno = error.errno
  patched.path = error.path
  patched.syscall = error.syscall
  return patched
}

fs.readlink = function patchedReadlink(path, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }

  return originalReadlink.call(fs, path, options, (error, linkString) => {
    if (error) return callback(asInvalidSymlinkError(error))
    return callback(null, linkString)
  })
}

fs.readlinkSync = function patchedReadlinkSync(path, options) {
  try {
    return originalReadlinkSync.call(fs, path, options)
  } catch (error) {
    throw asInvalidSymlinkError(error)
  }
}

if (originalPromisesReadlink) {
  fs.promises.readlink = async function patchedPromisesReadlink(path, options) {
    try {
      return await originalPromisesReadlink.call(fs.promises, path, options)
    } catch (error) {
      throw asInvalidSymlinkError(error)
    }
  }
}
