module.exports = class QueryBuilder {
  constructor(mongooseQuery, urlQuery) {
    this.mongooseQuery = mongooseQuery
    this.urlQuery = urlQuery
  }

  page() {
    const page = this.urlQuery.page * 1 || 1
    const limit = this.urlQuery.limit * 1 || 200
    const skip = (page - 1) * limit

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit)
    return this
  }

  sort() {
    this.mongooseQuery.sort(
      this.urlQuery.sort ? this.urlQuery.sort.split(',').join(' ') : 'createdAt'
    )
    return this
  }

  filter() {
    const toRemove = ['page', 'sort', 'limit', 'feilds']
    toRemove.forEach(el => delete this.urlQuery[el])

    const queryStr = JSON.stringify(this.urlQuery)
    const query = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
    this.mongooseQuery.find(JSON.parse(query))
    return this
  }

  fields() {
    this.mongooseQuery = this.mongooseQuery.select(
      this.urlQuery.feilds ? this.urlQuery.feilds.split(',').join(' ') : '-__v'
    )
    return this
  }
}
