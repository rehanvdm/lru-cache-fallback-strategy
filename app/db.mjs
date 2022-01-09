export async function getUser(userId)
{
  /* Simulate network call */
  await new Promise(resolve => setTimeout(resolve, parseInt(process.env.DB_FETCH_TIME)));

  process.env.DB_FETCHES = process.env.DB_FETCHES ? (parseInt(process.env.DB_FETCHES)+1) : 1;
  return {
    userId: userId,
    name: "name"+userId,
    permissions: []
    /* ... more properties ... */
  }
}
