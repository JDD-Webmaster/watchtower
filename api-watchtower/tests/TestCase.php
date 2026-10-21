<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    // Sanctum's statefulApi() middleware only starts a session for
    // requests it recognizes as coming from the SPA frontend — it checks
    // the Origin/Referer header against config('sanctum.stateful'), which
    // a plain postJson() in a test never sets. Without this, every test
    // hitting /api/register, /api/login, or any auth:sanctum route blows
    // up with "Session store not set on request."
    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Referer', 'http://localhost:3000');
    }
}
