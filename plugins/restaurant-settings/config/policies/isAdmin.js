'use strict';

/**
 * `isAdmin` policy.
 */

module.exports = async (ctx, next) => {
  // Add your own logic here.
  const { user } = ctx.state;


  //Ensure user is admin
  if (user) {
    const foundAdminUser = user.roles.find(role => role.id == 1);
    if (foundAdminUser) {
      return await next();
    }
  }

  ctx.unauthorized("Only admin allowed")
};
