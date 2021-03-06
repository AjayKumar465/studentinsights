class IepStorer
  def initialize(file_name:,
                 path_to_file:,
                 file_date:,
                 local_id:,
                 client:,
                 logger:)
    @file_name = file_name
    @path_to_file = path_to_file
    @file_date = file_date
    @local_id = local_id
    @client = client
    @logger = logger
  end

  def store
    @student = Student.find_by_local_id(@local_id)

    return @logger.info("student not in db!") unless @student

    return unless store_object_in_s3

    store_object_in_database
  end

  def store_object_in_s3
    # Client is supplied with the proper creds via
    # ENV['AWS_ACCESS_KEY_ID'] and ENV['AWS_SECRET_ACCESS_KEY']

    @logger.info("storing iep for student to s3...")

    response = @client.put_object(
      bucket: ENV['AWS_S3_IEP_BUCKET'],
      key: @file_name,
      body: File.open(@path_to_file),
      server_side_encryption: 'AES256'
    )

    return false unless response

    @logger.info("    successfully stored to s3!")
    @logger.info("    encrypted with: #{response[:server_side_encryption]}")

    return true
  end

  def store_object_in_database
    @logger.info("storing iep for student to db.")

    IepDocument.create!(
      file_date: @file_date,
      file_name: @file_name,
      student: @student
    )
  end

end
